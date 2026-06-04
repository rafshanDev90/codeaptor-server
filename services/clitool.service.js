import CliTool from '../models/clitool.model.js';
import Category from '../models/category.model.js';
import AppError from '../utils/appError.js';

export const getAllCliTools = async (filters) => {
  const { category, search, featured } = filters;
  const filter = { isActive: true };

  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (search) {
    filter.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
  }

  return await CliTool.find(filter)
    .populate('category', 'name slug')
    .sort({ isFeatured: -1, createdAt: -1 })
    .lean();
};

export const getCliToolBySlug = async (slug) => {
  const tool = await CliTool.findOne({ name: slug, isActive: true })
    .populate('category', 'name slug')
    .lean();
  
  if (!tool) throw new AppError('CLI tool not found.', 404);
  return tool;
};

export const getAdminTools = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const [tools, total] = await Promise.all([
    CliTool.find()
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CliTool.countDocuments(),
  ]);

  return { tools, total, pages: Math.ceil(total / limit) };
};

export const createTool = async (data, userId) => {
  const categoryExists = await Category.findById(data.category);
  if (!categoryExists) throw new AppError('Category not found.', 400);

  try {
    const tool = await CliTool.create({ ...data, createdBy: userId });
    return await CliTool.findById(tool._id).populate('category', 'name slug').lean();
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('A CLI tool with this name already exists.', 409);
    }
    throw error;
  }
};

export const updateTool = async (id, data) => {
  if (data.category) {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) throw new AppError('Category not found.', 400);
  }

  try {
    const tool = await CliTool.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('category', 'name slug')
      .lean();

    if (!tool) throw new AppError('CLI tool not found.', 404);
    return tool;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('A CLI tool with this name already exists.', 409);
    }
    throw error;
  }
};

export const deactivateTool = async (id) => {
  const tool = await CliTool.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  if (!tool) throw new AppError('CLI tool not found.', 404);
  return tool;
};

// Category Management
export const getAllCategories = async () => {
  return await Category.find().sort({ displayOrder: 1 }).lean();
};

export const createCategory = async (data) => {
  if (!data.slug) {
    data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  try {
    return await Category.create(data);
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('Category with this name or slug already exists.', 409);
    }
    throw error;
  }
};

export const updateCategory = async (id, data) => {
  if (data.slug) {
    data.slug = data.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  try {
    const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
    if (!category) throw new AppError('Category not found.', 404);
    return category;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('Category with this name or slug already exists.', 409);
    }
    throw error;
  }
};

export const deleteCategory = async (id) => {
  const toolsUsing = await CliTool.countDocuments({ category: id, isActive: true });
  
  if (toolsUsing > 0) {
    throw new AppError(`Cannot delete category. ${toolsUsing} active CLI tool(s) are using it.`, 400);
  }

  const category = await Category.findByIdAndDelete(id).lean();
  if (!category) throw new AppError('Category not found.', 404);
};
