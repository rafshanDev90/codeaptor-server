import mongoose from 'mongoose';
import User from '../models/user.model.js';
import CliTool from '../models/clitool.model.js';
import Category from '../models/category.model.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTools, activeTools, totalCategories, recentUsers] = await Promise.all([
      User.countDocuments(),
      CliTool.countDocuments(),
      CliTool.countDocuments({ isActive: true }),
      Category.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt').lean(),
    ]);

    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'healthy' : 'unhealthy';

    res.json({
      status: 'success',
      data: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};
