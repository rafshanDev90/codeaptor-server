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
import AppError from './utils/appError.js';

const app = express();

// 1) GLOBAL MIDDLEWARES

// Disable ETags to prevent 304 responses with empty body
app.set('etag', false);

// Trust first proxy for correct client IP detection
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet());

// Development logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS configuration
const corsOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://getcli.vercel.app',
  'https://5.189.147.108.nip.io',
  'http://5.189.147.108.nip.io:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  /^http:\/\/localhost:\d+$/,
].filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'svix-id', 'svix-timestamp', 'svix-signature'],
  credentials: true
}));

// Rate limiting
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

// 2) ROUTES

// IMPORTANT: Webhook router needs raw body, placed before express.json()
app.use('/api/v1/webhooks', webhookLimiter, webhookRouter);

// Body parser, reading data from body into req.body
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check
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

// Clerk Auth Middleware
app.use(clerkMiddleware());

// API Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/cli-tools', clitoolRouter);
app.use('/api/v1/admin', adminRouter);

// Handle undefined routes
app.all('/{*splat}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) GLOBAL ERROR HANDLING
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      logger.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
});

export default app;
