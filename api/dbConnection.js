// MongoDB connection utility optimized for Netlify serverless functions
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // If already connected, reuse the connection
  if (isConnected) {
    return;
  }

  try {
    // Serverless function optimizations
    const db = await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
      // Optimize for serverless - close idle connections quickly
      maxPoolSize: 5, // Limit pool size for serverless
      serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
      socketTimeoutMS: 10000, // 10 seconds socket timeout
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      // Connection retry logic
      retryWrites: true,
      retryReads: true
    });

    isConnected = db.connections[0].readyState === 1;
    
    if (isConnected) {
      console.log('✅ MongoDB connected successfully');
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    return db;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isConnected = false;
    
    // Don't throw error immediately, allow graceful degradation
    // The calling function should handle null returns
    return null;
  }
};

// Quick connection check without waiting
const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Graceful shutdown for serverless cleanup
const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('📤 MongoDB connection closed');
  }
};

module.exports = {
  connectDB,
  isDBConnected,
  disconnectDB
};