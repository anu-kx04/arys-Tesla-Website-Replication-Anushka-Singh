const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database'); // JSON database (WORKING VERSION)

/**
 * SIGNUP
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = db.createUser({
      name,
      email,
      password: hashedPassword
    });

    // Store session with timestamps for refresh token logic
    req.session.userId = newUser.id;
    req.session.userEmail = newUser.email;
    req.session.createdAt = Date.now();
    req.session.lastActivity = Date.now();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account'
    });
  }
});

/**
 * LOGIN
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please sign up first.'
      });
    }

    // Check password
    // Support both 'password' (new) and 'passwordHash' (legacy/existing) fields
    const storedPassword = user.password || user.passwordHash;

    if (!storedPassword) {
      console.error('User found but no password field:', user);
      return res.status(500).json({
        success: false,
        message: 'Account error: Invalid password data'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Store session with timestamps for refresh token logic
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.createdAt = Date.now();
    req.session.lastActivity = Date.now();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/**
 * LOGOUT
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }

    res.clearCookie('sessionId');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/**
 * CHECK AUTH STATUS
 * GET /api/auth/check
 */
router.get('/check', (req, res) => {
  try {
    // Debug logging
    console.log('=== AUTH CHECK ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Session userId:', req.session?.userId);
    console.log('Cookies:', req.headers.cookie);

    if (!req.session || !req.session.userId) {
      console.log('❌ No session or userId found');
      return res.json({
        success: true,
        isAuthenticated: false
      });
    }

    const user = db.findUserById(req.session.userId);

    if (!user) {
      console.log('❌ User not found for userId:', req.session.userId);
      req.session.destroy();
      return res.json({
        success: true,
        isAuthenticated: false
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    console.log('✅ User authenticated:', user.email);

    res.json({
      success: true,
      isAuthenticated: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check authentication'
    });
  }
});

/**
 * GET PROFILE
 * GET /api/auth/profile
 */
router.get('/profile', (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = db.findUserById(req.session.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * REFRESH SESSION
 * POST /api/auth/refresh
 * Extends the session if user is still active
 */
router.post('/refresh', (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'No active session to refresh'
      });
    }

    // Verify user still exists
    const user = db.findUserById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update last activity timestamp (rolling session will auto-extend)
    req.session.lastActivity = Date.now();

    // Session is automatically extended by the 'rolling: true' option
    // We just need to touch the session to trigger the extension
    req.session.touch();

    res.json({
      success: true,
      message: 'Session refreshed successfully',
      expiresIn: 120 // seconds (2 minutes for testing)
    });
  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh session'
    });
  }
});

module.exports = router;