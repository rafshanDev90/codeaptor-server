import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  console.error('GLOBAL ERROR HANDLER:', err.message, err.stack && err.stack.split('\n').slice(0, 4).join('\n'));
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  logger.error('ERROR 💥', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
}
