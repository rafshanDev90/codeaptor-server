import { Router } from 'express';
import { getProfile, getAdminDashboard, getAllUsers } from '../controllers/user.controller.js';
import { protectRoute, restrictTo } from '../middlewares/auth.middlewares.js';

const router = Router();

// 1. Fully protected route for any logged-in user
// First verifies token, then checks role profile, then returns data
router.get('/me', protectRoute, restrictTo('user', 'admin'), getProfile);

// 2. List all users — admin only
router.get('/', protectRoute, restrictTo('admin'), getAllUsers);

// 3. Highly restricted route implementing Least Privilege
router.get('/admin-dashboard', protectRoute, restrictTo('admin'), getAdminDashboard);

export default router;
