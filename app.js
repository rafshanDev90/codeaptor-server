import express from 'express';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import userRouter from './routes/user.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import clitoolRouter from './routes/clitool.routes.js';
import adminRouter from './routes/admin.routes.js';
import AppError from './utils/appError.js';
import { configureSecurity } from './config/security.js';
import { globalLimiter, webhookLimiter } from './config/rate-limit.js';
import { adminJs, adminJsRouter } from './config/adminjs.js';
import { registerHealthRoutes } from './routes/health.routes.js';
import { mountDiscoveryRoutes } from './routes/adminjs-api.routes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security, CORS, logging
configureSecurity(app);

// Rate limiting
app.use(globalLimiter);

// Webhooks (raw body, before JSON parser)
app.use('/api/v1/webhooks', webhookLimiter, webhookRouter);

// Body parser
app.use(express.json());

// Request logging
app.use(requestLogger);

// Public routes
registerHealthRoutes(app);

// AdminJS panel
app.use(adminJs.options.rootPath, adminJsRouter);
mountDiscoveryRoutes(adminJsRouter);

// Clerk auth + API routes
app.use(clerkMiddleware());
app.use('/api/v1/users', userRouter);
app.use('/api/v1/cli-tools', clitoolRouter);
app.use('/api/v1/admin', adminRouter);

// 404 handler
app.all('/{*splat}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

export default app;
