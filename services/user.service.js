import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

export const syncUser = async (clerkId, userData) => {
  return await User.findOneAndUpdate(
    { clerkId },
    {
      clerkId,
      name: userData.name,
      email: userData.email,
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();
};

export const deleteUserByClerkId = async (clerkId) => {
  const user = await User.findOneAndDelete({ clerkId }).lean();
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export const getUserByClerkId = async (clerkId) => {
  return await User.findOne({ clerkId }).lean();
};

export const createUser = async (userData) => {
  return await User.create(userData);
};

