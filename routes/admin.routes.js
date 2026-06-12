import { Router } from 'express';
import { protectRoute, restrictTo } from '../middlewares/auth.middlewares.js';
import { getAdminStats } from '../controllers/admin.controller.js';
import {
  triggerDiscovery,
  getDiscoveryStatus,
  getDiscoveryHistory,
  getDiscoveryLastRun,
} from '../controllers/discovery-run.controller.js';

const router = Router();

router.get('/stats', protectRoute, restrictTo('admin'), getAdminStats);

router.post('/discovery/start', protectRoute, restrictTo('admin'), triggerDiscovery);
router.get('/discovery/status/:id', protectRoute, restrictTo('admin'), getDiscoveryStatus);
router.get('/discovery/history', protectRoute, restrictTo('admin'), getDiscoveryHistory);
router.get('/discovery/last-run', protectRoute, restrictTo('admin'), getDiscoveryLastRun);

export default router;
