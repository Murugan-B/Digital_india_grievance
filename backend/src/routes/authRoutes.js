import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { AuthController } from '../controllers/authController.js';

const router = Router();

// GET /api/auth/profile - Returns verified profile for the authenticated Bearer token
router.get('/profile', requireAuth, AuthController.getProfile);

export default router;
