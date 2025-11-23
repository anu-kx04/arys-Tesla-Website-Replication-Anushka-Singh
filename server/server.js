require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');

// Import Routes - JSON DATABASE ONLY
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const recommendRoutes = require('./routes/recommendRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// MIDDLEWARE
// ==========================================

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  secret: process.env.SESSION_SECRET || 'tesla_secret_key_production_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days (increased from 24 hours)
  }
}));

// ==========================================
// ROUTES
// ==========================================

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    env: process.env.NODE_ENV || 'development',
    db: 'JSON (tesla_data.json)',
    timestamp: new Date().toISOString()
  });
});

// API Routes - WORKING WITH JSON DATABASE
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', recommendRoutes);

// Support Info
app.get('/api/support-info', (req, res) => {
  res.json({
    success: true,
    data: {
      phone: '+91-8765432109',
      email: 'ssanushka23@gmail.com',
      address: {
        name: 'PES University — Electronic City Campus',
        street: '1 University Road, Hosur Road',
        city: 'Bangalore',
        state: 'Karnataka',
        zip: '560100',
        country: 'India'
      },
      hours: {
        weekdays: '9:00 AM - 6:00 PM IST',
        weekends: '10:00 AM - 4:00 PM IST'
      }
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// START SERVER
// ==========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║    TESLA SERVER - JSON DATABASE    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(` Server:        http://localhost:${PORT}`);
  console.log(` Health:        http://localhost:${PORT}/health`);
  console.log(` Database:      JSON (tesla_data.json)`);
  console.log(` Auth:          ENABLED`);
  console.log(`Orders:        ENABLED`);
  console.log('');
  console.log(' Login/Signup ready to use!');
  console.log('');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(` Port ${PORT} already in use!`);
    process.exit(1);
  } else {
    console.error(' Server Error:', e);
  }
});