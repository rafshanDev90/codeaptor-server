import mongoose from 'mongoose';
import * as userRepo from '../repositories/user.repository.js';
import * as cliToolRepo from '../repositories/clitool.repository.js';
import * as categoryRepo from '../repositories/category.repository.js';

export const getSystemStats = async () => {
  const [totalUsers, totalTools, activeTools, totalCategories, recentUsers] = await Promise.all([
    userRepo.countUsers(),
    cliToolRepo.countTools(),
    cliToolRepo.countTools({ isActive: true }),
    categoryRepo.countCategories(),
    userRepo.findRecentUsers(5),
  ]);

  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'healthy' : 'unhealthy';

  return {
    stats: {
      users: { total: totalUsers },
      tools: { total: totalTools, active: activeTools },
      categories: { total: totalCategories },
    },
    recentUsers,
    system: {
      database: dbStatus,
      uptime: process.uptime(),
    },
  };
};
