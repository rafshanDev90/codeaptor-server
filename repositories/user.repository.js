import User from '../models/user.model.js';

export const findUserByClerkId = async (clerkId) => {
  return await User.findOne({ clerkId }).lean();
};

export const upsertUserByClerkId = async (clerkId, data) => {
  return await User.findOneAndUpdate(
    { clerkId },
    { clerkId, ...data },
    { upsert: true, new: true, runValidators: true }
  ).lean();
};

export const deleteUserByClerkId = async (clerkId) => {
  return await User.findOneAndDelete({ clerkId }).lean();
};

export const createUser = async (data) => {
  return await User.create(data);
};

export const findAllUsers = async (options = {}) => {
  let query = User.find().select('-__v');
  if (options.sort) query = query.sort(options.sort);
  return await query.lean();
};

export const findRecentUsers = async (limit = 5) => {
  return await User.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name email role createdAt')
    .lean();
};

export const countUsers = async (filter = {}) => {
  return await User.countDocuments(filter);
};
