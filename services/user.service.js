import AppError from '../utils/appError.js';
import * as userRepo from '../repositories/user.repository.js';

export const syncUser = async (clerkId, userData) => {
  return await userRepo.upsertUserByClerkId(clerkId, userData);
};

export const deleteUserByClerkId = async (clerkId) => {
  const user = await userRepo.deleteUserByClerkId(clerkId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export const getUserByClerkId = async (clerkId) => {
  return await userRepo.findUserByClerkId(clerkId);
};

export const getAllUsers = async () => {
  return await userRepo.findAllUsers({ sort: { createdAt: -1 } });
};

export const createUser = async (userData) => {
  return await userRepo.createUser(userData);
};
