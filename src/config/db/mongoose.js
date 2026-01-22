const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Suppress Mongoose warnings (duplicate indexes are handled, warnings are not critical)
const originalWarn = console.warn;
console.warn = function(...args) {
  // Filter out Mongoose duplicate index warnings
  const message = args.join(' ');
  if (message.includes('Duplicate schema index') || message.includes('MONGOOSE')) {
    return; // Suppress these warnings
  }
  originalWarn.apply(console, args);
};

// Helper function to check if running inside Docker
function isRunningInDocker() {
  // Check for .dockerenv file (Docker creates this)
  if (fs.existsSync('/.dockerenv')) {
    return true;
  }
  // Check for Docker in cgroup
  try {
    const cgroup = fs.readFileSync('/proc/self/cgroup', 'utf8');
    if (cgroup.includes('docker') || cgroup.includes('containerd')) {
      return true;
    }
  } catch (e) {
    // File doesn't exist, not in Docker
  }
  return false;
}

// MongoDB URI with fallback
let uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://dangvu123:dangvu123@dangvu.lz9hp1j.mongodb.net/PerfumeShop?retryWrites=true&w=majority";

// Auto-detect local development: replace 'mongo' hostname with 'localhost' if not in Docker
if (!isRunningInDocker() && uri.includes('mongo:')) {
  uri = uri.replace(/mongo:/g, 'localhost:');
  // Silent auto-detection - no log needed
}

// Mongoose connection options
const options = {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: "majority",
};

// Connect to MongoDB using Mongoose
async function connectDB() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Connect to MongoDB
    await mongoose.connect(uri, options);

    // Only log success in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ MongoDB connected: ${mongoose.connection.db.databaseName}`);
    }
    
    // Handle connection events (only log errors)
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  MongoDB disconnected');
      }
    });

    mongoose.connection.on('reconnected', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ MongoDB reconnected');
      }
    });

    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error; // Throw error so server can handle it
  }
}

// Close MongoDB connection
async function closeDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ MongoDB connection closed");
      }
    }
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error.message);
    throw error;
  }
}

// Get connection status
function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

module.exports = {
  connectDB,
  closeDB,
  getConnectionStatus,
  mongoose
};

