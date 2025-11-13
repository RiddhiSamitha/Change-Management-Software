const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters']
    },
    role: {
      type: String,
      enum: [
        'Developer',
        'Technical Lead', 
        'Change Manager',
        'Release Manager',
        'QA Engineer',
        'DevOps Engineer',
        'Auditor',
        'System Administrator',
        // Keep these for backward compatibility
        'Reviewer',
        'Admin'
      ],
      default: 'Developer'
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Helper method to check if user can approve CRs
UserSchema.methods.canApproveCRs = function() {
  const approverRoles = [
    'Technical Lead',
    'Change Manager', 
    'Release Manager',
    'System Administrator',
    'Reviewer',
    'Admin'
  ];
  return approverRoles.includes(this.role);
};

// Helper method to check if user is a developer-level role
UserSchema.methods.isDeveloperRole = function() {
  const developerRoles = [
    'Developer',
    'QA Engineer',
    'DevOps Engineer'
  ];
  return developerRoles.includes(this.role);
};

module.exports = mongoose.model('User', UserSchema);