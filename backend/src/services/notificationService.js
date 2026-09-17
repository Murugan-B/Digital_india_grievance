import crypto from 'crypto';
import { supabaseServer } from '../config/supabase.js';

// In-memory fallback repository when public.notifications table is pending manual DB migration execution
const fallbackStore = [];

export class NotificationService {
  /**
   * Internal Safe Insert Helper
   * Never throws uncaught exceptions to prevent disrupting grievance workflows.
   */
  static async createNotification({ recipient_id, grievance_id = null, type, title, message }) {
    if (!recipient_id || !title || !message || !type) {
      console.warn('[NotificationService] Missing required fields for notification creation.');
      return null;
    }

    try {
      const now = new Date();
      const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);

      // Check fallback store for duplicate suppression
      if (grievance_id) {
        const localDuplicate = fallbackStore.find(
          (n) =>
            n.recipient_id === recipient_id &&
            n.grievance_id === grievance_id &&
            n.type === type &&
            new Date(n.created_at) >= sixtySecondsAgo
        );
        if (localDuplicate) {
          return null;
        }

        // Check Supabase DB for duplicate suppression
        try {
          const { data: recentDuplicate, error: dupErr } = await supabaseServer
            .from('notifications')
            .select('id, recipient_id, grievance_id, type, title, message, is_read, created_at')
            .eq('recipient_id', recipient_id)
            .eq('grievance_id', grievance_id)
            .eq('type', type)
            .gte('created_at', sixtySecondsAgo.toISOString())
            .maybeSingle();

          if (!dupErr && recentDuplicate) {
            return null;
          }
        } catch (dbDupErr) {
          // Fall through to insert
        }
      }

      // Try inserting into Supabase PostgreSQL
      try {
        const { data, error } = await supabaseServer
          .from('notifications')
          .insert([
            {
              recipient_id,
              grievance_id,
              type,
              title: title.trim(),
              message: message.trim(),
              is_read: false,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (insertErr) {
        // Fall through to memory store
      }

      // Fallback in-memory storage
      const fallbackRecord = {
        id: crypto.randomUUID(),
        recipient_id,
        grievance_id,
        type,
        title: title.trim(),
        message: message.trim(),
        is_read: false,
        created_at: now.toISOString(),
      };
      fallbackStore.unshift(fallbackRecord);
      return fallbackRecord;
    } catch (err) {
      console.error('[NotificationService] Exception during notification creation:', err.message);
      return null;
    }
  }

  /**
   * 1. Citizen Notification: Grievance Successfully Submitted
   */
  static async notifyGrievanceSubmitted(grievance) {
    if (!grievance || !grievance.citizen_id) return null;

    return this.createNotification({
      recipient_id: grievance.citizen_id,
      grievance_id: grievance.id,
      type: 'grievance_submitted',
      title: 'Grievance Submitted',
      message: `Your grievance "${grievance.subject || 'Grievance'}" has been successfully recorded and queued for automated AI departmental routing.`,
    });
  }

  /**
   * 2. Citizen & Official Notifications: AI Routing Completed (Confidence >= 0.65)
   */
  static async notifyAIRouted({ citizen_id, grievance_id, department_name, confidence }) {
    if (!citizen_id || !department_name) return null;

    const confPct = confidence ? Math.round(confidence * 100) : null;
    const confText = confPct ? ` (${confPct}% confidence match)` : '';

    // 1. Notify Citizen
    const citizenNotif = await this.createNotification({
      recipient_id: citizen_id,
      grievance_id,
      type: 'ai_routed',
      title: 'Department Assigned',
      message: `Your grievance has been automatically assigned to the "${department_name}" department${confText}.`,
    });

    // 2. Notify Active Department Officials
    try {
      const { data: officials } = await supabaseServer
        .from('profiles')
        .select('id')
        .eq('role', 'official')
        .eq('account_status', 'active')
        .eq('department', department_name);

      if (officials && officials.length > 0) {
        for (const official of officials) {
          await this.createNotification({
            recipient_id: official.id,
            grievance_id,
            type: 'ai_routed',
            title: 'New Department Grievance',
            message: `A new grievance has been assigned to your department for investigation.`,
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Error finding officials for department notification:', err.message);
    }

    return { citizenNotif };
  }

  /**
   * 3. Citizen Notification: Low Confidence / Flagged for Manual Review
   */
  static async notifyAIReviewRequired({ citizen_id, grievance_id }) {
    if (!citizen_id) return null;

    return this.createNotification({
      recipient_id: citizen_id,
      grievance_id,
      type: 'ai_review_required',
      title: 'Awaiting Department Review',
      message: 'Your grievance has been flagged for administrative review and will be manually routed to the appropriate department.',
    });
  }

  /**
   * 4. Citizen Notification: Status Transition
   */
  static async notifyStatusChanged({ citizen_id, grievance_id, old_status, new_status, grievance_title = '' }) {
    if (!citizen_id || !new_status) return null;

    let type = 'status_changed';
    let title = 'Grievance Status Updated';
    let message = `Your grievance "${grievance_title}" status has been updated to "${new_status.replace('_', ' ').toUpperCase()}".`;

    if (new_status === 'in_progress') {
      title = 'Grievance In Progress';
      message = `Your grievance "${grievance_title}" is now actively being processed by the assigned nodal officer.`;
    } else if (new_status === 'resolved') {
      type = 'grievance_resolved';
      title = 'Grievance Resolved';
      message = `Your grievance "${grievance_title}" has been successfully resolved.`;
    } else if (new_status === 'rejected') {
      type = 'grievance_rejected';
      title = 'Grievance Closed / Rejected';
      message = `Your grievance "${grievance_title}" was reviewed and closed with status: Rejected.`;
    }

    return this.createNotification({
      recipient_id: citizen_id,
      grievance_id,
      type,
      title,
      message,
    });
  }

  /**
   * 5. Citizen & Official Notifications: Manual Department Assignment by Admin
   */
  static async notifyManualAssignment({ grievance, newDepartment }) {
    if (!grievance || !newDepartment) return null;

    // 1. Notify Citizen
    if (grievance.citizen_id) {
      await this.createNotification({
        recipient_id: grievance.citizen_id,
        grievance_id: grievance.id,
        type: 'manual_assignment',
        title: 'Department Assigned',
        message: `Your grievance "${grievance.subject || 'Grievance'}" has been assigned to the "${newDepartment}" department by central administration.`,
      });
    }

    // 2. Notify Target Department Officials
    try {
      const { data: officials } = await supabaseServer
        .from('profiles')
        .select('id')
        .eq('role', 'official')
        .eq('account_status', 'active')
        .eq('department', newDepartment);

      if (officials && officials.length > 0) {
        for (const official of officials) {
          await this.createNotification({
            recipient_id: official.id,
            grievance_id: grievance.id,
            type: 'manual_assignment',
            title: 'Grievance Re-Assigned to Department',
            message: `Grievance "${grievance.subject || 'Grievance'}" has been manually routed to your department for redressal.`,
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Failed to notify officials of manual assignment:', err.message);
    }
  }

  /**
   * 6. Retrieve Authenticated User's Notifications (Paginated)
   */
  static async getUserNotifications(userId, { page = 1, limit = 20, unread_only = false }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    try {
      let query = supabaseServer
        .from('notifications')
        .select('id, recipient_id, grievance_id, type, title, message, is_read, created_at', { count: 'exact' })
        .eq('recipient_id', userId);

      if (unread_only === 'true' || unread_only === true) {
        query = query.eq('is_read', false);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data: notifications, count, error } = await query;

      if (!error && notifications) {
        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);
        return {
          notifications,
          pagination: {
            total,
            page: pageNum,
            limit: pageSize,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        };
      }
    } catch (dbErr) {
      // Fall through to fallbackStore
    }

    // Use fallback store
    let userNotifs = fallbackStore.filter((n) => n.recipient_id === userId);
    if (unread_only === 'true' || unread_only === true) {
      userNotifs = userNotifs.filter((n) => !n.is_read);
    }
    const total = userNotifs.length;
    const totalPages = Math.ceil(total / pageSize);
    const paged = userNotifs.slice(offset, offset + pageSize);

    return {
      notifications: paged,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * 7. Get Unread Notification Count for User
   */
  static async getUnreadCount(userId) {
    try {
      const { count, error } = await supabaseServer
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (!error && typeof count === 'number') {
        return count;
      }
    } catch (err) {
      // Fall through to memory store
    }

    return fallbackStore.filter((n) => n.recipient_id === userId && !n.is_read).length;
  }

  /**
   * 8. Mark Single Notification as Read (Strict Recipient Isolation)
   */
  static async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', userId) // Security: recipient can only modify own notifications
        .select()
        .maybeSingle();

      if (!error) {
        return !!data;
      }
    } catch (dbErr) {
      // Fall through to fallbackStore
    }

    const item = fallbackStore.find((n) => n.id === notificationId && n.recipient_id === userId);
    if (item) {
      item.is_read = true;
      return true;
    }
    return false;
  }

  /**
   * 9. Mark All Notifications as Read for User
   */
  static async markAllAsRead(userId) {
    try {
      const { error } = await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (!error) {
        return { success: true };
      }
    } catch (dbErr) {
      // Fall through
    }

    fallbackStore.forEach((n) => {
      if (n.recipient_id === userId) {
        n.is_read = true;
      }
    });

    return { success: true };
  }
}
