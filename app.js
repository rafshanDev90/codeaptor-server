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

// AdminJS
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';
import MongoStore from 'connect-mongo';

const app = express();

// 1) GLOBAL MIDDLEWARES

// Disable ETags to prevent 304 responses with empty body
app.set('etag', false);

// Trust first proxy for correct client IP detection
app.set('trust proxy', 1);

// Serve static files (for AdminJS custom assets: logo, favicon)
app.use('/public', express.static('public'));

// Set security HTTP headers
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

// Sitemap
app.get('/api/sitemap.xml', async (req, res) => {
  const BASE_URL = 'https://getcli.vercel.app';

  try {
    const CliTool = mongoose.model('CliTool');
    const Category = mongoose.model('Category');

    const [tools, categories] = await Promise.all([
      CliTool.find({ isActive: true }, { name: 1, displayName: 1, updatedAt: 1 }).lean(),
      Category.find({}, { slug: 1, name: 1 }).sort({ displayOrder: 1 }).lean(),
    ]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    xml += `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1</priority></url>\n`;
    xml += `  <url><loc>${BASE_URL}/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
    xml += `  <url><loc>${BASE_URL}/terms</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>\n`;
    xml += `  <url><loc>${BASE_URL}/privacy</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>\n`;

    for (const tool of tools) {
      const date = tool.updatedAt ? new Date(tool.updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url><loc>${BASE_URL}/tool/${tool.name}</loc><lastmod>${date}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }

    for (const cat of categories) {
      xml += `  <url><loc>${BASE_URL}/browse?category=${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>\n`;
    }

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(xml);
  } catch (err) {
    res.status(500).set('Content-Type', 'application/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1</priority></url>\n` +
      `  <url><loc>${BASE_URL}/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n` +
      '</urlset>'
    );
  }
});

// AdminJS - auto-generated admin panel
AdminJS.registerAdapter(AdminJSMongoose);

const adminJs = new AdminJS({
  rootPath: '/admin',
  resources: [
    {
      resource: mongoose.model('CliTool'),
      options: {
        navigation: { name: 'Content', icon: 'Terminal' },
        properties: {
          _id: { isId: true },
          longDescription: { type: 'textarea' },
          metrics: { type: 'mixed' },
          'metrics.stars': { type: 'number' },
          'metrics.forks': { type: 'number' },
          'metrics.issues': { type: 'number' },
          'metrics.contributors': { type: 'number' },
          'metrics.weeklyGrowth': { type: 'number' },
          'metrics.downloads': { type: 'number' },
          seo: { type: 'mixed' },
          features: { type: 'mixed' },
          docs: { type: 'mixed' },
          createdAt: { isVisible: { list: true, show: true, edit: false } },
          updatedAt: { isVisible: { list: true, show: true, edit: false } },
        },
        sort: { direction: 'desc', sortBy: 'createdAt' },
      },
    },
    {
      resource: mongoose.model('Category'),
      options: {
        navigation: { name: 'Content', icon: 'Folder' },
        properties: {
          createdAt: { isVisible: { list: false, show: true, edit: false } },
          updatedAt: { isVisible: { list: false, show: true, edit: false } },
        },
      },
    },
    {
      resource: mongoose.model('User'),
      options: {
        navigation: { name: 'Administration', icon: 'User' },
        properties: {
          clerkId: { isVisible: { list: true, show: true, edit: false } },
          createdAt: { isVisible: { list: true, show: true, edit: false } },
          updatedAt: { isVisible: { list: false, show: true, edit: false } },
        },
        actions: {
          new: { isAccessible: false },
          delete: { isAccessible: false },
        },
      },
    },
    {
      resource: mongoose.model('DiscoveryRun'),
      options: {
        navigation: { name: 'Administration', icon: 'Settings' },
        properties: {
          log: { type: 'textarea' },
          triggeredBy: {
            type: 'reference',
            isVisible: { list: true, show: true, edit: false },
          },
          duration: {
            type: 'number',
            isVisible: { list: true, show: true, edit: false },
          },
          startedAt: { isVisible: { list: true, show: true, edit: false } },
          completedAt: { isVisible: { list: false, show: true, edit: false } },
          candidates: { isVisible: { list: true, show: true, edit: false } },
          inserted: { isVisible: { list: true, show: true, edit: false } },
          errors: { isVisible: { list: true, show: true, edit: false } },
          accumulated: { isVisible: { list: true, show: true, edit: false } },
        },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: false },
        },
      },
    },
  ],
  branding: {
    companyName: 'CLI Hub',
    withMadeWithLove: false,
  },
  locale: {
    language: 'en',
    translations: {
      labels: {
        CliTool: 'CLI Tools',
        Category: 'Categories',
        User: 'Users',
        DiscoveryRun: 'Discovery Runs',
      },
      messages: {
        loginWelcome: 'CLI Hub — Admin Panel',
      },
      properties: {
        CliTool: {
          displayName: 'Display Name',
          officialUrl: 'Official URL',
          downloadUrl: 'Download URL',
          isFeatured: 'Featured',
          isActive: 'Active',
          packageManager: 'Package Manager',
          installCommand: 'Install Command',
          longDescription: 'Long Description',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
        Category: {
          displayOrder: 'Display Order',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
        User: {
          clerkId: 'Clerk ID',
          createdAt: 'Joined At',
          updatedAt: 'Updated At',
        },
        DiscoveryRun: {
          triggeredBy: 'Triggered By',
          candidates: 'Candidates',
          inserted: 'Inserted',
          errors: 'Errors',
          accumulated: 'ML Accumulated',
          duration: 'Duration (ms)',
          startedAt: 'Started',
          completedAt: 'Completed',
          log: 'Log',
        },
      },
    },
  },
  dashboard: {
    handler: async () => {
      const { getSystemStats } = await import('./services/admin.service.js');
      const stats = await getSystemStats();

      const DiscoveryRun = mongoose.model('DiscoveryRun');
      const lastRun = await DiscoveryRun.findOne().sort({ startedAt: -1 }).select('status candidates inserted errors duration startedAt').lean();
      const runningRun = await DiscoveryRun.findOne({ status: 'running' }).select('_id startedAt').lean();

      return {
        totalTools: stats.stats.tools.total,
        activeTools: stats.stats.tools.active,
        totalUsers: stats.stats.users.total,
        totalCategories: stats.stats.categories.total,
        dbStatus: stats.system.database,
        uptime: stats.system.uptime,
        discovery: {
          isRunning: !!runningRun,
          lastRun: lastRun || null,
        },
      };
    },
  },
});

const DashboardComponent = adminJs.componentLoader.add('AdminDashboard', './admin/AdminDashboard.jsx');
adminJs.options.dashboard.component = DashboardComponent;

const adminJsSession = {
  secret: process.env.ADMINJS_SESSION_SECRET || 'change-me-session-secret',
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'adminSessions',
  }),
};

await adminJs.initialize();

const adminJsRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate: async (email, password) => {
      const adminEmail = process.env.ADMINJS_ADMIN_EMAIL;
      const adminPassword = process.env.ADMINJS_ADMIN_PASSWORD;
      if (email === adminEmail && password === adminPassword) {
        return { email, title: 'Admin' };
      }
      return null;
    },
    cookiePassword: process.env.ADMINJS_COOKIE_SECRET || 'change-me-cookie-secret',
  },
  null,
  adminJsSession,
);

adminJsRouter.use((err, req, res, next) => {
  console.error('ADMINJS INTERNAL ERROR:', err.message, err.stack?.split('\n').slice(0, 5).join('\n'));
  next(err);
});

app.use(adminJs.options.rootPath, adminJsRouter);

// Custom AdminJS API routes (protected by AdminJS session auth)
// Using GET with action param to avoid express-formidable parsing issues on POST
adminJsRouter.get('/api/discovery/start', async (req, res, next) => {
  try {
    const { startDiscovery } = await import('./services/discovery.service.js');
    const run = await startDiscovery(null);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminJsRouter.get('/api/discovery/stop', async (req, res, next) => {
  try {
    const { stopDiscovery } = await import('./services/discovery.service.js');
    const result = await stopDiscovery();
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminJsRouter.get('/api/discovery/logs', async (req, res, next) => {
  try {
    const { getActiveRunLogs, getCurrentRunId } = await import('./services/discovery.service.js');
    const [logs, runId] = await Promise.all([getActiveRunLogs(), getCurrentRunId()]);
    res.json({ logs, runId: runId ? runId.toString() : null });
  } catch (err) {
    next(err);
  }
});

adminJsRouter.get('/api/discovery/history', async (req, res, next) => {
  try {
    const { getRunHistory } = await import('./services/discovery.service.js');
    const history = await getRunHistory();
    res.json({ history });
  } catch (err) {
    next(err);
  }
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
  console.error('GLOBAL ERROR HANDLER:', err.message, err.stack && err.stack.split('\n').slice(0, 4).join('\n'));
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
