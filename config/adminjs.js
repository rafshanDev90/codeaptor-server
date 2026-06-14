import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

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
          triggeredBy: { type: 'reference', isVisible: { list: true, show: true, edit: false } },
          duration: { type: 'number', isVisible: { list: true, show: true, edit: false } },
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
      const { getSystemStats } = await import('../services/admin.service.js');
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

const DashboardComponent = adminJs.componentLoader.add('AdminDashboard', '../admin/AdminDashboard.jsx');
adminJs.options.dashboard.component = DashboardComponent;

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
  {
    secret: process.env.ADMINJS_SESSION_SECRET || 'change-me-session-secret',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'adminSessions',
    }),
  },
);

adminJsRouter.use((err, req, res, next) => {
  console.error('ADMINJS INTERNAL ERROR:', err.message, err.stack?.split('\n').slice(0, 5).join('\n'));
  next(err);
});

export { adminJs, adminJsRouter };
