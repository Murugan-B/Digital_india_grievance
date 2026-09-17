import { NotificationService } from '../services/notificationService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class NotificationController {
  /**
   * GET /api/notifications
   * Retrieves paginated notifications for the authenticated user.
   */
  static async getMyNotifications(req, res, next) {
    try {
      const { page, limit, unread_only } = req.query;
      const result = await NotificationService.getUserNotifications(req.user.id, {
        page,
        limit,
        unread_only,
      });

      return res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Retrieves total unread notifications count for the authenticated user.
   */
  static async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.id);
      return res.status(200).json({
        success: true,
        data: { unread_count: count },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Marks a specific notification as read ensuring recipient isolation.
   */
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID format.',
        });
      }

      const updated = await NotificationService.markAsRead(id, req.user.id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or you do not have permission to modify it.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: { id, is_read: true },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Marks all notifications as read for the authenticated user.
   */
  static async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (err) {
      next(err);
    }
  }
}
