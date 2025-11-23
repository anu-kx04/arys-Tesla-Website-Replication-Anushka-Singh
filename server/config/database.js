const mongoose = require('mongoose');

/**
 * MongoDB Database Connection (OPTIONAL)
 * Falls back to JSON file database if MongoDB is not available
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tesla_clone';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000, // Timeout after 3s instead of 30s
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.warn('⚠️  MongoDB Connection Failed:', error.message);
    console.warn('📝 Falling back to JSON file database');
    console.warn('💡 To use MongoDB: Install MongoDB locally or set MONGODB_URI in .env');
    return false; // Don't exit, just return false
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log(' Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.warn('⚠️  Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Handle application termination
process.on('SIGINT', async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed due to app termination');
  }
  process.exit(0);
});

module.exports = connectDB;
