const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const config = require('./config/config');
const sessionConfig = require('./config/session');
const { 
  corsMiddleware, 
  helmetMiddleware, 
  loggingMiddleware,
  authRateLimiter 
} = require('./middleware/securityMiddleware');

const app = express();

// ------------------------------------------
// FIX 1: Trust the Proxy (Fixes ERR_ERL...)
// ------------------------------------------
app.set('trust proxy', 1); 

// ==========================================
// MIDDLEWARE PIPELINE
// ==========================================
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(loggingMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionConfig);

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth', authRateLimiter, authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', env: config.NODE_ENV });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(config.PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on http://localhost:${config.PORT}`);
});