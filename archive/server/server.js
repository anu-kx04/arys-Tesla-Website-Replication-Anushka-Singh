require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const db = require('./database'); // Initialize SQLite

// Import Routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// 1. MIDDLEWARE
// ==========================================

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: true, // Allow any origin for debugging
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Session Management
app.use(session({
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'tesla_secret_key_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevent JS access
    secure: process.env.NODE_ENV === 'production', // True in production
    sameSite: 'lax', // CSRF protection
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// ==========================================
// 2. ROUTES
// ==========================================

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    env: process.env.NODE_ENV || 'development',
    db: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// 3. SERVER START
// ==========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Database: JSON File (tesla_data.json)`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('❌ Port 5000 is already in use! Please kill the process using port 5000.');
    process.exit(1);
  } else {
    console.error('❌ Server Error:', e);
  }
});