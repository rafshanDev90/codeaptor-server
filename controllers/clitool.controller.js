import { z } from 'zod';
import * as cliToolService from '../services/clitool.service.js';
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
    const tools = await cliToolService.getAllCliTools(req.query);
    res.json({ status: 'success', results: tools.length, data: { tools } });
  } catch (error) {
    next(error);
  }
};

export const getCliToolBySlug = async (req, res, next) => {
  try {
    const tool = await cliToolService.getCliToolBySlug(req.params.slug);
    res.json({ status: 'success', data: { tool } });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }
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
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    const result = await cliToolService.getAdminTools(pageNum, limitNum);

    res.json({
      status: 'success',
      data: { 
        tools: result.tools, 
        pagination: { 
          page: pageNum, 
          limit: limitNum, 
          total: result.total, 
          pages: result.pages 
        } 
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCliTool = async (req, res, next) => {
  try {
    const tool = await cliToolService.createTool(req.body, req.user._id);
    res.status(201).json({ status: 'success', data: { tool } });
  } catch (error) {
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return res.status(400).json({ status: 'fail', message: 'Category not found.' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ status: 'fail', message: 'A CLI tool with this name already exists.' });
    }
    next(error);
  }
};

export const updateCliTool = async (req, res, next) => {
  try {
    const tool = await cliToolService.updateTool(req.params.id, req.body);
    res.json({ status: 'success', data: { tool } });
  } catch (error) {
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return res.status(400).json({ status: 'fail', message: 'Category not found.' });
    }
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ status: 'fail', message: 'A CLI tool with this name already exists.' });
    }
    next(error);
  }
};

export const deleteCliTool = async (req, res, next) => {
  try {
    await cliToolService.deactivateTool(req.params.id);
    res.json({ status: 'success', message: 'CLI tool deactivated.' });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }
    next(error);
  }
};

export const updateCliToolSeo = async (req, res, next) => {
  try {
    const tool = await cliToolService.updateTool(req.params.id, { seo: req.body });
    res.json({ status: 'success', data: { tool } });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'CLI tool not found.' });
    }
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
    const categoryId = req.params.id;
    const toolsUsing = await cliToolService.getAllCliTools({ category: categoryId });
    
    if (toolsUsing.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete category. ${toolsUsing.length} active CLI tool(s) are using it.`,
      });
    }

    const category = await Category.findByIdAndDelete(categoryId).lean();

    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found.' });
    }

    res.json({ status: 'success', message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};

