import CliTool from '../models/clitool.model.js';
import Category from '../models/category.model.js';

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
  
  if (!tool) throw new Error('NOT_FOUND');
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
  if (!categoryExists) throw new Error('CATEGORY_NOT_FOUND');

  const tool = await CliTool.create({ ...data, createdBy: userId });
  return await CliTool.findById(tool._id).populate('category', 'name slug').lean();
};

export const updateTool = async (id, data) => {
  if (data.category) {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) throw new Error('CATEGORY_NOT_FOUND');
  }

  const tool = await CliTool.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('category', 'name slug')
    .lean();

  if (!tool) throw new Error('NOT_FOUND');
  return tool;
};

export const deactivateTool = async (id) => {
  const tool = await CliTool.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  if (!tool) throw new Error('NOT_FOUND');
  return tool;
};
