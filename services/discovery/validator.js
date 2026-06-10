import Category from '../../models/category.model.js';
import { VALID_CATEGORIES, VALID_PACKAGE_MANAGERS } from './config.js';

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function validateTool(extracted, existingNames) {
  const errors = [];

  if (!extracted.displayName?.trim()) errors.push('displayName');
  if (!extracted.name?.trim()) errors.push('name');
  if (!extracted.description?.trim()) errors.push('description');

  extracted.name = normalizeName(extracted.name || '');
  if (existingNames.has(extracted.name)) errors.push(`duplicate name "${extracted.name}"`);

  if (!extracted.category) {
    errors.push('category');
  } else {
    const match = VALID_CATEGORIES.find(c => extracted.category.toLowerCase().includes(c));
    if (match) {
      extracted.category = match;
    } else {
      errors.push(`invalid category "${extracted.category}"`);
    }
  }

  if (!extracted.packageManager) {
    extracted.packageManager = 'other';
  } else if (!VALID_PACKAGE_MANAGERS.includes(extracted.packageManager)) {
    extracted.packageManager = 'other';
  }

  let categoryId = null;
  if (extracted.category) {
    const catDoc = await Category.findOne({ slug: extracted.category }).lean();
    if (!catDoc) {
      errors.push(`category "${extracted.category}" not found in DB`);
    } else {
      categoryId = catDoc._id;
    }
  }

  return { valid: errors.length === 0, errors, categoryId };
}
