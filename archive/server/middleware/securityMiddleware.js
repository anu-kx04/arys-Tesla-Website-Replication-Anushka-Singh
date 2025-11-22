const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('../config/config');

// 1. CORS Configuration
const corsMiddleware = cors({
  origin: config.CORS_ORIGIN,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// 2. Helmet Configuration (CSP)
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], 
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"], 
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", config.CORS_ORIGIN]
    },
  },
});

// 3. Rate Limiter for Auth Routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, 
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Request Logger
const loggingMiddleware = morgan('dev');

module.exports = {
  corsMiddleware,
  helmetMiddleware,
  authRateLimiter,
  loggingMiddleware
};