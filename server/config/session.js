const session = require('express-session');
const config = require('./config');

const sessionConfig = session({
  secret: config.SESSION_SECRET,
  name: 'sessionId', // Name of the cookie
  resave: false,
  saveUninitialized: false, // Don't create session until something is stored
  cookie: {
    httpOnly: true, // Client-side JS cannot access this cookie (Security)
    secure: config.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days persistence
  }
});

module.exports = sessionConfig;