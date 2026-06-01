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

const app = express();

app.use(helmet());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
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
app.use(clerkMiddleware());

app.use('/api/v1/users', userRouter);

app.all('*', (req, res) => {
  res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error(JSON.stringify({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  }));

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

mongoose.connect(MONGO_URI)
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        mongoose.connection.close(false).then(() => {
          process.exit(0);
        });
      });
      setTimeout(() => {
        console.error('Forced shutdown after 30s.');
        process.exit(1);
      }, 30_000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
