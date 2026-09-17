import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { NotificationController } from '../controllers/notificationController.js';

const router = Router();

// All notification endpoints require authenticated user session
router.use(requireAuth);

router.get('/', NotificationController.getMyNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);

export default router;
