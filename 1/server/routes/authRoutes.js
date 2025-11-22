const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// In-memory user store (This resets when you restart the server!)
// In a real app, this would be a database connection.
const users = [];

const validateEmail = (email) => {
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

// POST /signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = users.find(u => u.email === normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered. Please login.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = { 
      id: Date.now().toString(), 
      name: name.trim(), 
      email: normalizedEmail, 
      password: hashedPassword 
    };
    users.push(newUser);

    // Create Session (only after successful signup)
    req.session.user = { id: newUser.id, email: newUser.email, name: newUser.name };
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Failed to create session' });
      }
      
      res.status(201).json({ 
        message: 'Signup successful', 
        user: req.session.user 
      });
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 1. Check if user exists
    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      // 404 tells frontend: "User not found, show signup popup"
      return res.status(404).json({ message: 'Account not found' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // 3. Create Session (only after successful authentication)
    req.session.user = { id: user.id, email: user.email, name: user.name };
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Failed to create session' });
      }
      
      res.status(200).json({ 
        message: 'Login successful', 
        user: req.session.user 
      });
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Could not log out' });
    res.clearCookie('sessionId'); // Matches name in config/session.js
    res.status(200).json({ message: 'Logout successful' });
  });
});

// GET /check - Verify session and validate user still exists
router.get('/check', (req, res) => {
  if (req.session && req.session.user) {
    // Verify the user still exists in the database
    const user = users.find(u => u.id === req.session.user.id && u.email === req.session.user.email);
    if (user) {
      // Session is valid and user exists
      res.status(200).json({ isAuthenticated: true, user: req.session.user });
    } else {
      // User was deleted or doesn't exist - invalidate session
      req.session.destroy(() => {
        res.status(401).json({ isAuthenticated: false, message: 'Session invalid' });
      });
    }
  } else {
    // 401 indicates no active session
    res.status(401).json({ isAuthenticated: false });
  }
});

module.exports = router;