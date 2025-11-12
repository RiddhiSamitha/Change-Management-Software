const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// --- POST /register ---
router.post(
  '/register',
  [
    body('email', 'Invalid email format').isEmail(),
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password, role } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      user = new User({ email, password, role });
      await user.save();

      const payload = {
        user: { id: user.id, role: user.role, email: user.email }
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      // ** THE FIX IS HERE **
      // Send the *same* response structure as the /login route
      // This makes your code consistent
      res.status(201).json({
        message: 'User registered successfully',
        token: token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role
        }
      });

    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);


// --- POST /login ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const payload = {
      user: { 
        id: user.id, // Use MongoDB's 'id'
        role: user.role, 
        email: user.email 
      }
    };

    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // This response is correct and matches AuthContext.js
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ** THE FIX IS HERE **
// The file was exporting twice. Only export once at the end.
module.exports = router;