import CliTool from '../models/clitool.model.js';
import Category from '../models/category.model.js';
import AppError from '../utils/appError.js';
import { getOrSet, cacheKey, invalidate } from './cache.service.js';


const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Call FastAPI ML service to predict category from text.
 * Returns category ID or null if prediction fails / confidence too low.
 */
async function predictCategory(displayName, description) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, description }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.warn(`ML service returned ${response.status}`);
      return null;
    }

    const result = await response.json();
    if (result.status !== 'success') return null;

    const { predicted_category_id, confidence } = result.data;

    if (confidence < 0.5) {
      console.warn(`ML confidence too low: ${confidence}`);
      return null;
    }

    return predicted_category_id;
  } catch (error) {
    console.warn('ML prediction unavailable:', error.message);
    return null;
  }
}

export const getAllCliTools = async (filters) => {
  const key = cacheKey('clitools', `all:${JSON.stringify(filters)}`);

  return await getOrSet(key, async () => {
    const { category, search, featured } = filters;
    const filter = { isActive: true };

    if (category) {
      const catDoc = await Category.findOne({ slug: category }).select('_id').lean();
      if (!catDoc) return [];
      filter.category = catDoc._id;
    }
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
  });
};


export const getCliToolBySlug = async (slug) => {
  const key = cacheKey('clitools', `slug:${slug}`);

  return await getOrSet(key, async () => {
    const tool = await CliTool.findOne({ name: slug, isActive: true })
      .populate('category', 'name slug')
      .lean();
    
    if (!tool) throw new AppError('CLI tool not found.', 404);
    return tool;
  });
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
  // ML auto-categorization: predict category if not provided
  if (!data.category) {
    const predictedCategoryId = await predictCategory(
      data.displayName,
      data.description,
    );
    if (predictedCategoryId) {
      console.log(`ML auto-categorized to category ID: ${predictedCategoryId}`);
      data.category = predictedCategoryId;
    }
  }

  if (data.category) {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) throw new AppError('Category not found.', 400);
  } else {
    throw new AppError(
      'Category is required. Provide one or ensure the ML service is running.',
      400,
    );
  }

  try {
    const tool = await CliTool.create({ ...data, createdBy: userId });
    const result = await CliTool.findById(tool._id).populate('category', 'name slug').lean();
    await invalidate('clitools:*'); 
    return result;
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
    await invalidate('clitools:*');
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
  await invalidate('clitools:*'); 
  return tool;
};

// Category Management
export const getAllCategories = async () => {
  const key = cacheKey('categories', 'all');

  return await getOrSet(key, async () => {
    return await Category.find().sort({ displayOrder: 1 }).lean();
  });
};


export const createCategory = async (data) => {
  if (!data.slug) {
    data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  try {
    const category = await Category.create(data);
    await invalidate('categories:*');
    return category;
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
    await invalidate('categories:*');
    await invalidate('clitools:*');
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

  // Clears categories list
  await invalidate('categories:*');
  
  // Clears any tool queries that might reference the deleted category
  await invalidate('clitools:*'); 
};

