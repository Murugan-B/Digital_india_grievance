import { Router } from 'express';
import { OfficialController } from '../controllers/officialController.js';
import { requireAuth, requireOfficial } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all official endpoints with authentication and active official authorization
router.use(requireAuth);
router.use(requireOfficial);

// Routes
router.get('/', OfficialController.getGrievances);
router.get('/stats', OfficialController.getStats);
router.get('/:id', OfficialController.getGrievanceDetail);
router.patch('/:id/status', OfficialController.updateStatus);

export default router;
