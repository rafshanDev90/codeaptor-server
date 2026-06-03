import * as adminService from '../services/admin.service.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const data = await adminService.getSystemStats();
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

