import { supabaseServer } from '../config/supabase.js';
import { NotificationService } from './notificationService.js';
import { AttachmentService } from './attachmentService.js';

// Valid status transitions allowed for departmental officials
const ALLOWED_TRANSITIONS = {
  submitted: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: [], // No reopening in this phase
  rejected: [],
};

export class OfficialService {
  /**
   * Fetch all grievances assigned strictly to the official's department
   */
  static async getDepartmentGrievances(department, { status, priority, search } = {}) {
    let query = supabaseServer
      .from('grievances')
      .select('id, citizen_id, subject, description, category, department, location, preferred_language, status, priority, created_at, updated_at')
      .eq('department', department);

    if (status && status !== 'all') {
      query = query.eq('status', status.toLowerCase().trim());
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority.toLowerCase().trim());
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      // If search looks like a UUID, search by ID, else search subject/category
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(cleanSearch)) {
        query = query.eq('id', cleanSearch);
      } else {
        query = query.ilike('subject', `%${cleanSearch}%`);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[OfficialService.getDepartmentGrievances] DB Error:', error.message);
      const dbErr = new Error('Failed to retrieve department grievances.');
      dbErr.statusCode = 500;
      throw dbErr;
    }

    return data || [];
  }

  /**
   * Aggregate statistics for the official's department and portal unassigned count
   */
  static async getDepartmentStats(department) {
    // 1. Department-assigned grievances
    const { data: deptTickets, error: deptError } = await supabaseServer
      .from('grievances')
      .select('status')
      .eq('department', department);

    if (deptError) {
      console.error('[OfficialService.getDepartmentStats] DB Error:', deptError.message);
      const dbErr = new Error('Failed to compute department statistics.');
      dbErr.statusCode = 500;
      throw dbErr;
    }

    const tickets = deptTickets || [];
    const totalAssigned = tickets.length;
    const submitted = tickets.filter((t) => t.status === 'submitted').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    const rejected = tickets.filter((t) => t.status === 'rejected').length;

    // 2. Count unassigned tickets (department IS NULL) awaiting AI routing
    const { count: pendingRoutingCount, error: countError } = await supabaseServer
      .from('grievances')
      .select('*', { count: 'exact', head: true })
      .is('department', null);

    if (countError) {
      console.error('[OfficialService.getDepartmentStats] Count Error:', countError.message);
    }

    return {
      totalAssigned,
      submitted,
      inProgress,
      resolved,
      rejected,
      pendingRouting: pendingRoutingCount || 0,
    };
  }

  /**
   * Retrieve a single grievance verifying department ownership and fetch audit history
   */
  static async getGrievanceById(department, grievanceId) {
    // 1. Fetch grievance with strict department filter
    const { data: grievance, error: grievanceError } = await supabaseServer
      .from('grievances')
      .select('id, citizen_id, subject, description, category, department, location, preferred_language, status, priority, created_at, updated_at')
      .eq('id', grievanceId)
      .eq('department', department)
      .maybeSingle();

    if (grievanceError) {
      console.error('[OfficialService.getGrievanceById] DB Error:', grievanceError.message);
      const dbErr = new Error('Failed to retrieve grievance detail.');
      dbErr.statusCode = 500;
      throw dbErr;
    }

    if (!grievance) {
      return null;
    }

    // 2. Fetch status history audit records
    const { data: history, error: historyError } = await supabaseServer
      .from('grievance_status_history')
      .select('id, old_status, new_status, notes, changed_at, profiles(full_name, designation)')
      .eq('grievance_id', grievanceId)
      .order('changed_at', { ascending: true });

    if (historyError) {
      console.error('[OfficialService.getGrievanceById] History Error:', historyError.message);
    }

    // 3. Fetch evidence attachments
    const attachments = await AttachmentService.getGrievanceAttachments(grievanceId);

    return {
      ...grievance,
      status_history: history || [],
      attachments: attachments || [],
    };
  }

  /**
   * Update grievance status with strict transition validation and audit logging
   */
  static async updateGrievanceStatus(officialId, department, grievanceId, newStatus, notes = '') {
    // 1. Fetch existing record to verify department and current status
    const { data: existing, error: fetchErr } = await supabaseServer
      .from('grievances')
      .select('id, status, department')
      .eq('id', grievanceId)
      .eq('department', department)
      .maybeSingle();

    if (fetchErr || !existing) {
      const notFoundErr = new Error('Grievance not found in your department or you do not have permission to update it.');
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    const currentStatus = existing.status;
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(newStatus)) {
      const invalidErr = new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${
          allowedNext.length ? allowedNext.join(', ') : 'None (terminal state)'
        }.`
      );
      invalidErr.statusCode = 400;
      throw invalidErr;
    }

    // 2. Update grievance status and timestamp
    const nowIso = new Date().toISOString();
    const { data: updatedGrievance, error: updateErr } = await supabaseServer
      .from('grievances')
      .update({
        status: newStatus,
        updated_at: nowIso,
      })
      .eq('id', grievanceId)
      .eq('department', department)
      .select()
      .single();

    if (updateErr) {
      console.error('[OfficialService.updateGrievanceStatus] Update error:', updateErr.message);
      const dbErr = new Error('Failed to update grievance status.');
      dbErr.statusCode = 500;
      throw dbErr;
    }

    // 3. Insert audit log entry into grievance_status_history
    const historyEntry = {
      grievance_id: grievanceId,
      changed_by: officialId,
      old_status: currentStatus,
      new_status: newStatus,
      notes: notes ? notes.trim() : null,
      changed_at: nowIso,
    };

    const { error: histErr } = await supabaseServer
      .from('grievance_status_history')
      .insert([historyEntry]);

    if (histErr) {
      console.error('[OfficialService.updateGrievanceStatus] Audit log error:', histErr.message);
      // Non-fatal for response, but logged securely
    }

    // 4. Phase 10 Notification: Citizen status update alert
    try {
      await NotificationService.notifyStatusChanged(updatedGrievance, currentStatus, newStatus, notes);
    } catch (notifErr) {
      console.warn('[OfficialService.updateGrievanceStatus] Notification warning:', notifErr.message);
    }

    return updatedGrievance;
  }
}
