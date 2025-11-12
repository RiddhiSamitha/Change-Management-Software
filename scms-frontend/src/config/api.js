import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- API ENDPOINTS (Updated for MERN) ---

// 1. Authentication API
export const authAPI = {
  // Register new user - hits POST http://localhost:5000/register
  register: async (email, password, role = 'Developer') => {
    const response = await api.post('/register', { email, password, role });
    return response.data;
  },

  // Login user - hits POST http://localhost:5000/login
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  
  // Logout (client-side action, just resolves)
  logout: async () => {
    return Promise.resolve({ message: "Logout successful" });
  }
};

// 2. Change Request (CR) API - CONNECTED TO MERN BACKEND
export const crAPI = {
    // Fetches all CRs from GET http://localhost:5000/api/change-requests
    getAll: async () => {
        // This middleware in the backend (authMiddleware) will
        // automatically filter CRs for the logged-in user
        const response = await api.get('/api/change-requests');
        return response.data; // Returns { changeRequests: [...] }
    },
    // Creates a new CR at POST http://localhost:5000/api/change-requests
    create: async (formData) => {
        const response = await api.post('/api/change-requests', formData);
        return response.data; // Returns the new CR object
    }
};

export default api;