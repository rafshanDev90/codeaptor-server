import { z } from 'zod';
import { validate } from '../middlewares/auth.middlewares.js';
import CliTool from '../models/clitool.model.js';
import Category from '../models/category.model.js';

const urlOrEmpty = z.string().url().optional().or(z.literal(''));

export const createCliToolSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  category: z.string().min(1),
  description: z.string().min(1).max(2000),
  officialUrl: z.string().url(),
  downloadUrl: urlOrEmpty,
  icon: z.string().optional(),
  version: z.string().optional(),
  packageManager: z.enum(['npm', 'pip', 'brew', 'go', 'cargo', 'apt', 'yum', 'choco', 'scoop', 'other']).optional(),
  installCommand: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateCliToolSchema = createCliToolSchema.partial();

export const updateCliToolSeoSchema = z.object({
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(200).optional(),
  ogImage: urlOrEmpty,
  keywords: z.array(z.string()).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const getCliTools = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;
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

    const tools = await CliTool.find(filter)
      .populate('category', 'name slug')
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    res.json({ status: 'success', results: tools.length, data: { tools } });
  } catch (error) {
    next(error);
  }
};

export const getCliToolBySlug = async (req, res, next) => {
  try {
    const tool = await CliTool.findOne({ name: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .lean();

    if (!tool) {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }

    res.json({ status: 'success', data: { tool } });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 }).lean();
    res.json({ status: 'success', data: { categories } });
  } catch (error) {
    next(error);
  }
};

export const getAdminCliTools = async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [tools, total] = await Promise.all([
      CliTool.find()
        .populate('category', 'name slug')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CliTool.countDocuments(),
    ]);

    res.json({
      status: 'success',
      data: { tools, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } },
    });
  } catch (error) {
    next(error);
  }
};

export const createCliTool = async (req, res, next) => {
  try {
    const data = req.body;

    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      return res.status(400).json({ status: 'fail', message: 'Category not found.' });
    }

    const tool = await CliTool.create({ ...data, createdBy: req.user._id });
    const populated = await CliTool.findById(tool._id).populate('category', 'name slug').lean();

    res.status(201).json({ status: 'success', data: { tool: populated } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'fail', message: 'A CLI tool with this name already exists.' });
    }
    next(error);
  }
};

export const updateCliTool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.category) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        return res.status(400).json({ status: 'fail', message: 'Category not found.' });
      }
    }

    const tool = await CliTool.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('category', 'name slug')
      .lean();

    if (!tool) {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }

    res.json({ status: 'success', data: { tool } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'fail', message: 'A CLI tool with this name already exists.' });
    }
    next(error);
  }
};

export const deleteCliTool = async (req, res, next) => {
  try {
    const tool = await CliTool.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).lean();

    if (!tool) {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }

    res.json({ status: 'success', message: 'CLI tool deactivated.' });
  } catch (error) {
    next(error);
  }
};

export const updateCliToolSeo = async (req, res, next) => {
  try {
    const tool = await CliTool.findByIdAndUpdate(
      req.params.id,
      { $set: { seo: req.body } },
      { new: true, runValidators: true },
    )
      .populate('category', 'name slug')
      .lean();

    if (!tool) {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }

    res.json({ status: 'success', data: { tool } });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    const category = await Category.create(data);
    res.status(201).json({ status: 'success', data: { category } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'fail', message: 'Category with this name or slug already exists.' });
    }
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const data = req.body;
    if (data.slug) {
      data.slug = data.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).lean();

    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found.' });
    }

    res.json({ status: 'success', data: { category } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'fail', message: 'Category with this name or slug already exists.' });
    }
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const toolsUsing = await CliTool.countDocuments({ category: req.params.id, isActive: true });
    if (toolsUsing > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete category. ${toolsUsing} active CLI tool(s) are using it.`,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id).lean();

    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found.' });
    }

    res.json({ status: 'success', message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};
