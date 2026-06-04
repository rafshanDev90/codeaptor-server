import { getAuth } from '@clerk/express';
import * as userService from '../services/user.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const protectRoute = catchAsync(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new AppError('Unauthorized - no valid session.', 401));
  }

  const currentUser = await userService.getUserByClerkId(userId);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  req.user = currentUser;
  next();
});

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthorized - user not authenticated.', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }
    next();
  };
};

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: 'fail',
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

