import { Router } from 'express';
import { protectRoute, restrictTo } from '../middlewares/auth.middlewares.js';
import { getAdminStats } from '../controllers/admin.controller.js';

const router = Router();

router.get('/stats', protectRoute, restrictTo('admin'), getAdminStats);

export default router;
