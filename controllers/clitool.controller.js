import { z } from 'zod';
import * as cliToolService from '../services/clitool.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

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

export const getCliTools = catchAsync(async (req, res, next) => {
  const tools = await cliToolService.getAllCliTools(req.query);
  res.json({ status: 'success', results: tools.length, data: { tools } });
});

export const getCliToolBySlug = catchAsync(async (req, res, next) => {
  const tool = await cliToolService.getCliToolBySlug(req.params.slug);
  res.json({ status: 'success', data: { tool } });
});

export const getCategories = catchAsync(async (req, res, next) => {
  const categories = await cliToolService.getAllCategories();
  res.json({ status: 'success', data: { categories } });
});

export const getAdminCliTools = catchAsync(async (req, res, next) => {
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
});

export const createCliTool = catchAsync(async (req, res, next) => {
  const tool = await cliToolService.createTool(req.body, req.user._id);
  res.status(201).json({ status: 'success', data: { tool } });
});

export const updateCliTool = catchAsync(async (req, res, next) => {
  const tool = await cliToolService.updateTool(req.params.id, req.body);
  res.json({ status: 'success', data: { tool } });
});

export const deleteCliTool = catchAsync(async (req, res, next) => {
  await cliToolService.deactivateTool(req.params.id);
  res.json({ status: 'success', message: 'CLI tool deactivated.' });
});

export const updateCliToolSeo = catchAsync(async (req, res, next) => {
  const tool = await cliToolService.updateTool(req.params.id, { seo: req.body });
  res.json({ status: 'success', data: { tool } });
});

export const createCategory = catchAsync(async (req, res, next) => {
  const category = await cliToolService.createCategory(req.body);
  res.status(201).json({ status: 'success', data: { category } });
});

export const updateCategory = catchAsync(async (req, res, next) => {
  const category = await cliToolService.updateCategory(req.params.id, req.body);
  res.json({ status: 'success', data: { category } });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  await cliToolService.deleteCategory(req.params.id);
  res.json({ status: 'success', message: 'Category deleted.' });
});


