import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import userRouter from './routes/user.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import clitoolRouter from './routes/clitool.routes.js';
import adminRouter from './routes/admin.routes.js';
import { logger } from './utils/logger.js';

const app = express();

// Trust first proxy for correct client IP detection behind reverse proxy
app.set('trust proxy', 1);

app.use(helmet());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const corsOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://5.189.147.108.nip.io',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'svix-id', 'svix-timestamp', 'svix-signature'],
  credentials: true
}));


const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { status: 'fail', message: 'Too many webhook requests' },
});
app.use('/api/v1/webhooks', webhookLimiter);

app.use('/api/v1/webhooks', webhookRouter);
app.use(express.json());

// Health Check Endpoint
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
  res.status(dbStatus === 'up' ? 200 : 503).json({
    status: dbStatus === 'up' ? 'success' : 'error',
    timestamp: new Date(),
    services: {
      database: dbStatus,
      server: 'up'
    }
  });
});

app.use((req, res, next) => {

  logger.info(`Request: ${req.method} ${req.originalUrl}`);
  next();
});
app.use(clerkMiddleware());

app.use('/api/v1/users', userRouter);
app.use('/api/v1/cli-tools', clitoolRouter);
app.use('/api/v1/admin', adminRouter);

app.all('/*splat', (req, res) => {
  res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  logger.error(`Error processing request: ${req.method} ${req.path}`, err, {
    path: req.path,
    method: req.method,
  });

  if (err.name === 'WebhookVerificationError') {
    return res.status(401).json({ status: 'fail', message: 'Invalid webhook signature' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ status: 'fail', message: err.message });
  }

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';

logger.info(`Starting server on port ${PORT}...`);
logger.info(`Attempting to connect to MongoDB...`);

mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('Connected to MongoDB successfully.');
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        mongoose.connection.close(false).then(() => {
          logger.info('MongoDB connection closed. Exiting process.');
          process.exit(0);
        });
      });
      setTimeout(() => {
        logger.error('Forced shutdown after 30s.');
        process.exit(1);
      }, 30_000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((err) => {
    logger.error('MongoDB connection error during startup:', err);
    process.exit(1);
  });
