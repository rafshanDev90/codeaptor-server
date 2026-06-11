import mongoose from 'mongoose';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';

// Load models to register them with mongoose
import './models/clitool.model.js';
import './models/category.model.js';
import './models/user.model.js';

AdminJS.registerAdapter(AdminJSMongoose);

const adminJs = new AdminJS({
  rootPath: '/admin',
  resources: [
    mongoose.model('CliTool'),
    mongoose.model('Category'),
    mongoose.model('User'),
  ],
  branding: { companyName: 'Test', withMadeWithLove: false },
});

try {
  await adminJs.initialize();
  console.log('AdminJS initialized OK with all resources');
} catch (e) {
  console.error('INIT ERROR:', e.message);
  console.error(e.stack?.split('\n').slice(0, 10).join('\n'));
}
