import { Router } from 'express';
import { validate } from '../middlewares/auth.middlewares.js';
import { protectRoute, restrictTo } from '../middlewares/auth.middlewares.js';
import {
  getCliTools,
  getCliToolBySlug,
  getCategories,
  getCategoryCounts,
  getAdminCliTools,
  createCliTool,
  updateCliTool,
  deleteCliTool,
  updateCliToolSeo,
  createCategory,
  updateCategory,
  deleteCategory,
  createCliToolSchema,
  updateCliToolSchema,
  updateCliToolSeoSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../controllers/clitool.controller.js';
const router = Router();

router.get('/', getCliTools);
router.get('/categories', getCategories);
router.get('/categories/counts', getCategoryCounts);
router.get('/:slug', getCliToolBySlug);

router.get('/admin/all', protectRoute, restrictTo('admin'), getAdminCliTools);
router.post('/', protectRoute, restrictTo('admin'), validate(createCliToolSchema), createCliTool);
router.put('/:id', protectRoute, restrictTo('admin'), validate(updateCliToolSchema), updateCliTool);
router.delete('/:id', protectRoute, restrictTo('admin'), deleteCliTool);
router.put('/:id/seo', protectRoute, restrictTo('admin'), validate(updateCliToolSeoSchema), updateCliToolSeo);

router.post('/categories', protectRoute, restrictTo('admin'), validate(createCategorySchema), createCategory);
router.put('/categories/:id', protectRoute, restrictTo('admin'), validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', protectRoute, restrictTo('admin'), deleteCategory);

export default router;
