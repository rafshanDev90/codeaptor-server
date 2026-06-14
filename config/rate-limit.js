import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
});

export const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { status: 'fail', message: 'Too many webhook requests' },
});
