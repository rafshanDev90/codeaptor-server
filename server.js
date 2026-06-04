import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { logger } from './utils/logger.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';

let server;

// Connect to Database
logger.info('Attempting to connect to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('Connected to MongoDB successfully.');
    
    // Start Server
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error during startup:', err);
    process.exit(1);
  });

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle Graceful Shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      mongoose.connection.close(false).then(() => {
        logger.info('MongoDB connection closed. Exiting process.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
  
  // Force exit after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after 30s.');
    process.exit(1);
  }, 30_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
