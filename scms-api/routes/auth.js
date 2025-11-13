const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// --- POST /register ---
// (REG-01, 02, 03, 04, 05, 06, 07)
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
        // (REG-02)
        return res.status(400).json({ error: 'Email already registered' });
      }
      user = new User({ email, password, role });
      await user.save(); // (REG-06) bcrypt hash happens in User.js model

      const payload = {
        user: { id: user.id, role: user.role, email: user.email }
      };
      
      // (REG-01, REG-07) Issue JWT on successful registration
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      // Return the same structure as login for consistency
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
// (LOGIN-01, 02, 03)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // (LOGIN-03) Specific error for user not found
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // (LOGIN-02) Specific error for invalid password
      return res.status(400).json({ error: 'Invalid password' });
    }

    // (LOGIN-01) User is valid, create payload and token
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
      { expiresIn: '24h' } // (LOGIN-06) Token expiry is set
    );

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

module.exports = router;