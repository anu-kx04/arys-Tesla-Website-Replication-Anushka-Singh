require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
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

// CORS Configuration - Allow both local and production frontend
const allowedOrigins = [
  'http://localhost:3000',
  'https://arys-tesla-website-replication-anushka.onrender.com',
  'https://tesla-website-replication-anushka-singh.vercel.app', // Previous Vercel URL
  'https://arys-tesla-website-replication-anus-orpin.vercel.app' // Actual Vercel deployment
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Trust proxy - CRITICAL for Render deployment with HTTPS
app.set('trust proxy', 1);

// Session Management (30-minute timeout with automatic refresh)
app.use(session({
  store: new FileStore({
    path: './sessions',
    ttl: 1800, // 30 minutes (in seconds)
    retries: 0
  }),
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'tesla_secret_key_production_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site in production
    maxAge: 1000 * 60 * 30, // 30 minutes
    path: '/' // Explicitly set cookie path
  },
  rolling: true // Reset session expiry on each request
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