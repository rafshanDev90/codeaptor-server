import Category from '../models/category.model.js';

export const findCategoryBySlug = async (slug) => {
  return await Category.findOne({ slug }).select('_id').lean();
};

export const findCategoryById = async (id) => {
  return await Category.findById(id).lean();
};

export const findAllCategories = async (sort = { displayOrder: 1 }) => {
  return await Category.find().sort(sort).lean();
};

export const createCategory = async (data) => {
  return await Category.create(data);
};

export const updateCategoryById = async (id, data) => {
  return await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const deleteCategoryById = async (id) => {
  return await Category.findByIdAndDelete(id).lean();
};

export const countCategories = async (filter = {}) => {
  return await Category.countDocuments(filter);
};
