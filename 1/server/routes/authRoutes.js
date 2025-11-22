const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ==========================================
// 1. SIGNUP
// ==========================================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, region } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // 2. Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create User
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      region: region || 'US'
    });

    await newUser.save();

    // 5. Create Session
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      region: newUser.region
    };

    // 6. Return Success
    res.status(201).json({
      message: 'Signup successful',
      isAuthenticated: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        region: newUser.region
      }
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// 2. LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Find User
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Security: Use generic message or 404 as requested
      return res.status(404).json({ message: 'Account not found' });
    }

    // 3. Compare Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
        isAuthenticated: false
      });
    }

    // 4. Create Session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      region: user.region
    };

    // 5. Return Success
    res.status(200).json({
      message: 'Login successful',
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        region: user.region
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// 3. LOGOUT
// ==========================================
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout Error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('sessionId');
      res.status(200).json({
        success: true,
        isAuthenticated: false,
        message: 'Logged out successfully'
      });
    });
  } catch (error) {
    console.error('Logout Exception:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// 4. CHECK SESSION
// ==========================================
router.get('/check', (req, res) => {
  try {
    if (req.session && req.session.user) {
      res.status(200).json({
        isAuthenticated: true,
        user: req.session.user
      });
    } else {
      res.status(200).json({
        isAuthenticated: false,
        user: null
      });
    }
  } catch (error) {
    console.error('Check Session Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;