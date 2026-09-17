import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { AnalyticsController } from '../controllers/analyticsController.js';

const router = Router();

// Analytics endpoints strictly restricted to verified Administrators
router.use(requireAuth, requireAdmin);

router.get('/overview', AnalyticsController.getOverview);

export default router;
