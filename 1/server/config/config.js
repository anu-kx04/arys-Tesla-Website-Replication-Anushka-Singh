// Load environment variables from .env file
require('dotenv').config();

// Export the configuration object
const config = {
    // Application settings
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,

    // Security settings
    SESSION_SECRET: process.env.SESSION_SECRET || 'fallback_secret_must_be_changed',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

module.exports = config;