"""
SCMS User Registration and Login Backend
Implements: SCMS-F-001, SCMS-SR-002, SCMS-SR-003, SE-6 (User Login with JWT, including logout)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import re
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
import jwt # Import the JWT library
from functools import wraps

app = Flask(__name__)
# FIX 1: Explicitly configure CORS to allow requests from the frontend port (3003)
CORS(app, resources={r"/*": {"origins": "http://localhost:3003"}}, supports_credentials=True)

# Configuration for User Registration
USER_DATA_FILE = 'users.json'
MIN_PASSWORD_LENGTH = 8

# New Configuration for JWT (SE-6)
# IMPORTANT: Use a complex, secure key in a real application, ideally from environment variables.
app.config['SECRET_KEY'] = 'a_very_secret_key_for_scms_jwt_12345' 
TOKEN_EXPIRY_HOURS = 24 # Token expiry ~24h (from Acceptance Criteria)

# --- JWT Helper Functions ---

def jwt_required(f):
    """Decorator to protect routes - checks for a valid JWT in the Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # JWT is expected in the Authorization header: Bearer <token>
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            # Token not provided
            return jsonify({'message': 'Authorization token is missing!'}), 401

        try:
            # Decode the token using the secret key
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            # The current_user object is the payload of the JWT
            request.current_user = data 
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            # Invalid token format or signature mismatch
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)

    return decorated

# --- User Registration Service Extended ---

class UserRegistrationService:
    """Service class handling user registration and now login logic"""
    
    def __init__(self, data_file: str):
        self.data_file = data_file
        self._ensure_data_file_exists()
    
    def _ensure_data_file_exists(self):
        """Create JSON file if it doesn't exist"""
        if not os.path.exists(self.data_file):
            with open(self.data_file, 'w') as f:
                json.dump({"users": []}, f)
    
    def _read_users(self) -> Dict:
        """Read users from JSON file"""
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {"users": []}
    
    def _write_users(self, data: Dict):
        """Write users to JSON file - Interface for database connection"""
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Fetch user by email for login"""
        data = self._read_users()
        # Find the user whose email matches (case-insensitive)
        user = next((u for u in data.get('users', []) if u['email'].lower() == email.lower()), None)
        return user

    def verify_password(self, stored_hash: str, provided_password: str) -> bool:
        """Verify the provided password against the stored hash"""
        # SCMS-NF-004: Data encryption standards (using check_password_hash)
        return check_password_hash(stored_hash, provided_password)
    
    def validate_email(self, email: str) -> Tuple[bool, str]:
        """Validates email format and uniqueness"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return False, "Invalid email format"
        
        data = self._read_users()
        existing_emails = [user['email'] for user in data.get('users', [])]
        if email.lower() in [e.lower() for e in existing_emails]:
            return False, "Email already registered"
        
        return True, "Valid email"
    
    def validate_password(self, password: str) -> Tuple[bool, str]:
        """Validates password meets security requirements"""
        if len(password) < MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
        
        # Additional security checks (recommended but negotiable)
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        if not re.search(r'\d', password):
            return False, "Password must contain at least one digit"
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        
        return True, "Valid password"
    
    def generate_user_id(self) -> str:
        """Generate unique user ID"""
        data = self._read_users()
        users = data.get('users', [])
        
        year = datetime.now().year
        current_year_users = [u for u in users if u['user_id'].startswith(f'USR-{year}')]
        if current_year_users:
            last_num = max([int(u['user_id'].split('-')[-1]) for u in current_year_users])
            next_num = last_num + 1
        else:
            next_num = 1
        
        return f"USR-{year}-{next_num:04d}"
    
    def register_user(self, email: str, password: str, role: str = 'Developer') -> Tuple[bool, Dict]:
        """Register new user"""
        # (Email/Password/Role validation logic remains the same)
        # ... (Validation logic is here)
        
        valid_email, email_msg = self.validate_email(email)
        if not valid_email:
            return False, {"error": email_msg, "status_code": 400}
        
        valid_password, password_msg = self.validate_password(password)
        if not valid_password:
            return False, {"error": password_msg, "status_code": 400}
        
        valid_roles = [
            'Developer', 'Technical Lead', 'Change Manager', 
            'Release Manager', 'QA Engineer', 'DevOps Engineer', 
            'Auditor', 'System Administrator'
        ]
        if role not in valid_roles:
            return False, {"error": f"Invalid role. Must be one of: {', '.join(valid_roles)}", "status_code": 400}
        
        user_id = self.generate_user_id()
        password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        
        # Create user object
        user = {
            "user_id": user_id,
            "email": email.lower(),
            "password_hash": password_hash,
            "role": role,
            "created_at": datetime.now().isoformat(),
            "is_active": True,
            "failed_login_attempts": 0,
            "mfa_enabled": role in ['Change Manager', 'Release Manager', 'Auditor']
        }
        
        # Save to JSON
        data = self._read_users()
        data['users'].append(user)
        self._write_users(data)
        
        return True, {
            "user_id": user_id,
            "email": email.lower(),
            "role": role,
            "message": "User registered successfully",
            "status_code": 201
        }

# Initialize service
user_service = UserRegistrationService(USER_DATA_FILE)

# --- Routes ---

@app.route('/register', methods=['POST']) 
def register():
    """User Registration Endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        role = data.get('role', 'Developer')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        success, result = user_service.register_user(email, password, role)
        
        if success:
            response = {
                "user_id": result['user_id'],
                "email": result['email'],
                "role": result['role'],
                "message": result['message']
            }
            return jsonify(response), result['status_code']
        else:
            return jsonify({"error": result['error']}), result['status_code']
    
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/login', methods=['POST'])
def login():
    """User Login Endpoint. Issues a JWT upon successful authentication."""
    try:
        data = request.get_json()
        if not data or not 'email' in data or not 'password' in data:
            return jsonify({'error': 'Please provide both email and password'}), 400
        
        email = data['email'].strip()
        password = data['password']

        user = user_service.get_user_by_email(email)

        # Check if user exists and password is correct
        if user and user_service.verify_password(user['password_hash'], password):
            
            # Generate JWT Payload
            expiration_time = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)
            payload = {
                'user_id': user['user_id'],
                'email': user['email'],
                'role': user['role'],
                'exp': expiration_time,
                'iat': datetime.utcnow()
            }

            # Encode the token
            token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

            # Return success response (Valid creds -> 200 + JWT)
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user_id': user['user_id'],
                'role': user['role']
            }), 200

        else:
            # Handle invalid credentials (Invalid -> 401)
            return jsonify({'error': 'Invalid email or password'}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# NEW ROUTE: User Logout (Completes SE-6: clear logout path)
@app.route('/logout', methods=['POST'])
def logout():
    """
    Logout Endpoint. Signals the client to discard the JWT.
    """
    # Simply return a 200 OK message to the client.
    return jsonify({
        "message": "Logout successful. Client should delete the local token."
    }), 200 


@app.route('/api/v1/protected-data', methods=['GET'])
@jwt_required
def protected_route():
    """
    Example endpoint that requires a valid JWT.
    """
    # The request.current_user is set by the jwt_required decorator
    return jsonify({
        "message": "Access granted to protected data",
        "user_info": request.current_user 
    }), 200


@app.route('/api/v1/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user details by ID"""
    try:
        data = user_service._read_users()
        user = next((u for u in data['users'] if u['user_id'] == user_id), None)
        
        if user:
            safe_user = {k: v for k, v in user.items() if k != 'password_hash'}
            return jsonify(safe_user), 200
        else:
            return jsonify({"error": "User not found"}), 404
    
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "SCMS User Registration and Login",
        "version": "1.1"
    }), 200


if __name__ == '__main__':
    print("SCMS Backend running on port 5000, supporting /register, /login, and /logout.")
    app.run(debug=True, host='0.0.0.0', port=5000)