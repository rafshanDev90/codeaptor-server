import AppError from '../utils/appError.js';
import { getOrSet, cacheKey, invalidate } from './cache.service.js';
import * as cliToolRepo from '../repositories/clitool.repository.js';
import * as categoryRepo from '../repositories/category.repository.js';
import { searchTools as tsSearch } from './search.service.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

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
  const { category, search, featured } = filters;

  if (search) {
    const tsResult = await tsSearch(search, { category, featured });
    const ids = tsResult.tools.map((t) => t["_.id"]);
    if (ids.length === 0) return [];
    const tools = await cliToolRepo.findTools({ _id: { $in: ids }, isActive: true });
    const idOrder = new Map(ids.map((id, i) => [id.toString(), i]));
    tools.sort((a, b) => (idOrder.get(a._id.toString()) || 0) - (idOrder.get(b._id.toString()) || 0));
    return tools;
  }

  const key = cacheKey('clitools', `all:${JSON.stringify(filters)}`);

  return await getOrSet(key, async () => {
    const filter = { isActive: true };

    if (category) {
      const catDoc = await categoryRepo.findCategoryBySlug(category);
      if (!catDoc) return [];
      filter.category = catDoc._id;
    }

    if (featured === 'true') filter.isFeatured = true;

    return await cliToolRepo.findTools(filter, { sort: { isFeatured: -1, createdAt: -1 } });
  });
};

export const getCliToolBySlug = async (slug) => {
  const key = cacheKey('clitools', `slug:${slug}`);

  return await getOrSet(key, async () => {
    const tool = await cliToolRepo.findToolBySlug(slug);
    if (!tool) throw new AppError('CLI tool not found.', 404);
    return tool;
  });
};

export const getAdminTools = async (page = 1, limit = 50) => {
  return await cliToolRepo.findToolsWithPagination(
    {},
    { createdAt: -1 },
    page,
    limit
  );
};

export const createTool = async (data, userId) => {
  if (!data.category) {
    const predictedCategoryId = await predictCategory(data.displayName, data.description);
    if (predictedCategoryId) {
      data.category = predictedCategoryId;
    }
  }

  if (data.category) {
    const categoryExists = await categoryRepo.findCategoryById(data.category);
    if (!categoryExists) throw new AppError('Category not found.', 400);
  } else {
    throw new AppError(
      'Category is required. Provide one or ensure the ML service is running.',
      400,
    );
  }

  try {
    const tool = await cliToolRepo.createTool({ ...data, createdBy: userId });
    const result = await cliToolRepo.findToolById(tool._id);
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
    const categoryExists = await categoryRepo.findCategoryById(data.category);
    if (!categoryExists) throw new AppError('Category not found.', 400);
  }

  try {
    const tool = await cliToolRepo.updateToolById(id, data);
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
  const tool = await cliToolRepo.deactivateToolById(id);
  if (!tool) throw new AppError('CLI tool not found.', 404);
  await invalidate('clitools:*');
  return tool;
};

export const getAllCategories = async () => {
  const key = cacheKey('categories', 'all');
  return await getOrSet(key, async () => {
    return await categoryRepo.findAllCategories({ displayOrder: 1 });
  });
};

export const getCategoryCounts = async () => {
  const key = cacheKey('categories', 'counts');
  return await getOrSet(key, async () => {
    const counts = await cliToolRepo.aggregateTools([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, name: '$category.name', slug: '$category.slug', count: 1 } },
      { $sort: { count: -1 } },
    ]);
    return counts;
  });
};

export const createCategory = async (data) => {
  if (!data.slug) {
    data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  try {
    const category = await categoryRepo.createCategory(data);
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
    const category = await categoryRepo.updateCategoryById(id, data);
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
  const toolsUsing = await cliToolRepo.countTools({ category: id, isActive: true });

  if (toolsUsing > 0) {
    throw new AppError(`Cannot delete category. ${toolsUsing} active CLI tool(s) are using it.`, 400);
  }

  const category = await categoryRepo.deleteCategoryById(id);
  if (!category) throw new AppError('Category not found.', 404);

  await invalidate('categories:*');
  await invalidate('clitools:*');
};
