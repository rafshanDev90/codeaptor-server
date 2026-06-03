import User from '../models/user.model.js';

export const syncUser = async (clerkId, userData) => {
  return await User.findOneAndUpdate(
    { clerkId },
    {
      clerkId,
      name: userData.name,
      email: userData.email,
    },
    { upsert: true, new: true, runValidators: true }
  );
};

export const deleteUserByClerkId = async (clerkId) => {
  return await User.findOneAndDelete({ clerkId });
};

export const getUserByClerkId = async (clerkId) => {
  return await User.findOne({ clerkId });
};

export const createUser = async (userData) => {
  return await User.create(userData);
};
