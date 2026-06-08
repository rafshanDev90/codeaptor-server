import { z } from 'zod';
import { validate } from '../middlewares/auth.middlewares.js';
import * as userService from '../services/user.service.js';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const getProfile = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ status: 'fail', message: 'User not attached.' });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: req.user._id,
        clerkId: req.user.clerkId,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
};

export const getAdminDashboard = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the secure administrative control panel.',
  });
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ status: 'success', data: { users } });
  } catch (error) {
    next(error);
  }
};
