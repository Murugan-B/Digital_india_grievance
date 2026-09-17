import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { GrievanceController } from '../controllers/grievanceController.js';
import { requireAuth, requireCitizen } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * Rate Limiter for Grievance Submissions (POST /api/grievances)
 * Allows up to 40 submissions per 15 minutes per IP.
 */
const grievanceSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many grievance submissions from this IP address. Please wait a few minutes before trying again.',
  },
});

// Protect POST / with rate limiter first, then requireAuth and requireCitizen
router.post('/', grievanceSubmissionLimiter, requireAuth, requireCitizen, GrievanceController.submitGrievance);

// Protected Citizen GET endpoints
router.get('/', requireAuth, requireCitizen, GrievanceController.getMyGrievances);
router.get('/:id', requireAuth, requireCitizen, GrievanceController.getGrievanceDetail);

export default router;
