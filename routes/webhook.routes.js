import { Router, raw } from 'express';
import { handleClerkWebhook } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/clerk', raw({ type: 'application/json' }), handleClerkWebhook);

export default router;
