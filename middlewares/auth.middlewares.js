import { getAuth, clerkClient } from '@clerk/express';
import User from '../models/user.model.js';
import { z } from 'zod';

export const protectRoute = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - no valid session.' });
    }

    let currentUser = await User.findOne({ clerkId: userId });

    if (!currentUser) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.emailAddresses[0]?.emailAddress;
      currentUser = await User.create({
        clerkId: userId,
        name,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - user not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
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
