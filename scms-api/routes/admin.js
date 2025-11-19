const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ChangeRequest = require('../models/ChangeRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || !['Admin', 'System Administrator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Apply auth and admin check to all routes
router.use(authMiddleware, isAdmin);

// ============= USER MANAGEMENT =============

// GET all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create new user (Admin only)
router.post('/users', [
  body('email', 'Invalid email format').isEmail(),
  body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  body('role', 'Valid role is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password, role } = req.body;
  
  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const newUser = new User({ email, password, role });
    await newUser.save();
    
    // Return user without password
    const userResponse = await User.findById(newUser._id).select('-password');
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user (Admin only)
router.put('/users/:id', [
  body('email', 'Invalid email format').optional().isEmail(),
  body('role', 'Valid role is required').optional().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, role, password } = req.body;
  
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (email) user.email = email;
    if (role) user.role = role;
    
    // Update password if provided
    if (password && password.trim().length >= 8) {
      user.password = password; // Will be hashed by pre-save hook
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE user (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    await user.deleteOne();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= SYSTEM STATISTICS =============

// GET system statistics
router.get('/statistics', async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // CR statistics
    const totalCRs = await ChangeRequest.countDocuments();
    const crsByStatus = await ChangeRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const crsByCategory = await ChangeRequest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Recent activity
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentCRs = await ChangeRequest.find()
      .populate('createdBy', 'email role')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      users: {
        total: totalUsers,
        byRole: usersByRole
      },
      changeRequests: {
        total: totalCRs,
        byStatus: crsByStatus,
        byCategory: crsByCategory
      },
      recentActivity: {
        users: recentUsers,
        changeRequests: recentCRs
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============= ALL CRs VIEW (Admin Override) =============

// GET all CRs (Admin can see everything)
router.get('/change-requests', async (req, res) => {
  try {
    const crs = await ChangeRequest.find()
      .populate('createdBy', 'email role')
      .populate('submittedBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('rejectedBy', 'email role')
      .sort({ updatedAt: -1 });
    
    res.json({ changeRequests: crs });
  } catch (error) {
    console.error('Error fetching CRs:', error);
    res.status(500).json({ error: 'Failed to fetch change requests' });
  }
});

module.exports = router;