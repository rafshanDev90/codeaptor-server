import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

export function configureSecurity(app) {
  app.set('etag', false);
  app.set('trust proxy', 1);

  app.use('/public', express.static('public'));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }));

  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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
    credentials: true,
  }));
}
