import { supabaseServer } from '../config/supabase.js';
import { NotificationService } from './notificationService.js';
import { AttachmentService } from './attachmentService.js';

export class AdminService {
  /**
   * 1. Get Live High-Level System Statistics
   */
  static async getSystemStats() {
    // 1. User counts
    const { data: users, error: userErr } = await supabaseServer
      .from('profiles')
      .select('role, account_status');

    if (userErr) {
      console.error('[AdminService.getSystemStats] User query error:', userErr.message);
      throw new Error('Failed to fetch user metrics');
    }

    let totalCitizens = 0;
    let totalOfficials = 0;
    let pendingOfficials = 0;
    let suspendedUsers = 0;

    users.forEach((u) => {
      if (u.role === 'citizen') totalCitizens++;
      if (u.role === 'official') {
        totalOfficials++;
        if (u.account_status === 'pending') pendingOfficials++;
      }
      if (u.account_status === 'suspended') suspendedUsers++;
    });

    // 2. Grievance status counts
    const { data: grievances, error: grievErr } = await supabaseServer
      .from('grievances')
      .select('status, department, priority');

    if (grievErr) {
      console.error('[AdminService.getSystemStats] Grievance query error:', grievErr.message);
      throw new Error('Failed to fetch grievance metrics');
    }

    const grievanceStats = {
      total: grievances.length,
      submitted: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      unassigned: 0,
    };

    grievances.forEach((g) => {
      if (g.status === 'submitted') grievanceStats.submitted++;
      else if (g.status === 'in_progress') grievanceStats.in_progress++;
      else if (g.status === 'resolved') grievanceStats.resolved++;
      else if (g.status === 'rejected') grievanceStats.rejected++;

      if (!g.department || g.department.trim() === '') {
        grievanceStats.unassigned++;
      }
    });

    // 3. AI Routing Flagged Count
    const { count: flaggedCount, error: flaggedErr } = await supabaseServer
      .from('grievance_ai_routings')
      .select('id', { count: 'exact', head: true })
      .eq('routing_status', 'flagged_for_review');

    const { count: totalRoutings, error: routingErr } = await supabaseServer
      .from('grievance_ai_routings')
      .select('id', { count: 'exact', head: true });

    // 4. Department counts
    const { count: activeDeptsCount, error: deptErr } = await supabaseServer
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    return {
      users: {
        totalCitizens,
        totalOfficials,
        pendingOfficials,
        suspendedUsers,
      },
      grievances: grievanceStats,
      ai: {
        totalRoutings: totalRoutings || 0,
        flaggedForReview: flaggedCount || 0,
      },
      departments: {
        activeCount: activeDeptsCount || 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 2. Get Paginated Users List with Filters
   */
  static async getUsers({ page = 1, limit = 20, search = '', role = '', account_status = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    let query = supabaseServer
      .from('profiles')
      .select('id, full_name, email, mobile_number, role, account_status, preferred_language, department, designation, created_at, updated_at', { count: 'exact' });

    if (role && ['citizen', 'official', 'admin'].includes(role)) {
      query = query.eq('role', role);
    }

    if (account_status && ['active', 'pending', 'suspended'].includes(account_status)) {
      query = query.eq('account_status', account_status);
    }

    if (search && search.trim()) {
      const term = search.trim();
      // Search by name, email, or mobile
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,mobile_number.ilike.%${term}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: users, count, error } = await query;

    if (error) {
      console.error('[AdminService.getUsers] Query error:', error.message);
      throw new Error('Failed to retrieve user directory');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      users: users || [],
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
   * 3. Get Specific User Profile by ID
   */
  static async getUserById(userId) {
    const { data, error } = await supabaseServer
      .from('profiles')
      .select('id, full_name, email, mobile_number, role, account_status, preferred_language, department, designation, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[AdminService.getUserById] Lookup error:', error.message);
      throw new Error('Failed to fetch user profile');
    }

    if (!data) {
      const notFound = new Error('User not found');
      notFound.statusCode = 404;
      throw notFound;
    }

    // If user is a citizen, fetch grievance summary count
    if (data.role === 'citizen') {
      const { count: grievanceCount } = await supabaseServer
        .from('grievances')
        .select('id', { count: 'exact', head: true })
        .eq('citizen_id', userId);
      data.grievance_count = grievanceCount || 0;
    }

    return data;
  }

  /**
   * 4. Update User Account Status (Activate / Suspend)
   */
  static async updateUserStatus(targetUserId, newStatus, currentAdminId) {
    if (targetUserId === currentAdminId) {
      const err = new Error('Security Restriction: Administrators cannot modify their own status or role.');
      err.statusCode = 400;
      throw err;
    }

    if (!['active', 'pending', 'suspended'].includes(newStatus)) {
      const err = new Error('Invalid account status. Allowed: active, pending, suspended');
      err.statusCode = 400;
      throw err;
    }

    const { data, error } = await supabaseServer
      .from('profiles')
      .update({
        account_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('[AdminService.updateUserStatus] Update error:', error.message);
      throw new Error('Failed to update account status');
    }

    return data;
  }

  /**
   * 5. Verify Official Registration (Approve / Reject / Suspend)
   */
  static async verifyOfficial(targetUserId, action, currentAdminId) {
    if (!['approve', 'reject', 'suspend'].includes(action)) {
      const err = new Error('Invalid verification action. Allowed: approve, reject, suspend');
      err.statusCode = 400;
      throw err;
    }

    // Fetch existing profile to ensure it is an official
    const userProfile = await this.getUserById(targetUserId);
    if (userProfile.role !== 'official') {
      const err = new Error('The selected user is not registered as an official account.');
      err.statusCode = 400;
      throw err;
    }

    const nextStatus = action === 'approve' ? 'active' : 'suspended';

    const { data, error } = await supabaseServer
      .from('profiles')
      .update({
        account_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('[AdminService.verifyOfficial] Error:', error.message);
      throw new Error(`Failed to ${action} official registration`);
    }

    return data;
  }

  /**
   * 6. Get All Departments with Usage Metadata
   */
  static async getDepartments({ search = '', is_active = '' }) {
    let query = supabaseServer
      .from('departments')
      .select('id, name, code, description, is_active, created_at, updated_at');

    if (is_active !== '') {
      query = query.eq('is_active', is_active === 'true' || is_active === true);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%,description.ilike.%${term}%`);
    }

    query = query.order('name', { ascending: true });

    const { data: departments, error } = await query;
    if (error) {
      console.error('[AdminService.getDepartments] Query error:', error.message);
      throw new Error('Failed to fetch departments');
    }

    // Attach active grievances count per department
    const { data: activeGrievances } = await supabaseServer
      .from('grievances')
      .select('department')
      .in('status', ['submitted', 'in_progress']);

    const deptCounts = {};
    if (activeGrievances) {
      activeGrievances.forEach((g) => {
        if (g.department) {
          deptCounts[g.department] = (deptCounts[g.department] || 0) + 1;
        }
      });
    }

    return (departments || []).map((d) => ({
      ...d,
      active_grievances_count: deptCounts[d.name] || 0,
    }));
  }

  /**
   * 7. Create New Department
   */
  static async createDepartment({ name, code, description }) {
    if (!name || !name.trim()) {
      const err = new Error('Department name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!code || !code.trim()) {
      const err = new Error('Department code is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const cleanDesc = description ? description.trim() : '';

    const { data, error } = await supabaseServer
      .from('departments')
      .insert([
        {
          name: cleanName,
          code: cleanCode,
          description: cleanDesc,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const err = new Error('A department with this name or code already exists.');
        err.statusCode = 409;
        throw err;
      }
      console.error('[AdminService.createDepartment] Error:', error.message);
      throw new Error('Failed to create department');
    }

    return data;
  }

  /**
   * 8. Update Department (Description & Active/Inactive State with Dependency Check)
   */
  static async updateDepartment(deptId, { description, is_active, force = false }) {
    const { data: existingDept, error: fetchErr } = await supabaseServer
      .from('departments')
      .select('id, name, code, is_active')
      .eq('id', deptId)
      .maybeSingle();

    if (fetchErr || !existingDept) {
      const err = new Error('Department not found.');
      err.statusCode = 404;
      throw err;
    }

    // If deactivating department, verify if active grievances depend on it
    if (is_active === false && existingDept.is_active === true) {
      const { count: activeGrievancesCount } = await supabaseServer
        .from('grievances')
        .select('id', { count: 'exact', head: true })
        .eq('department', existingDept.name)
        .in('status', ['submitted', 'in_progress']);

      if (activeGrievancesCount > 0 && !force) {
        const warningErr = new Error(
          `Cannot deactivate department: ${activeGrievancesCount} active grievance(s) are currently assigned to "${existingDept.name}". Please confirm deliberate deactivation.`
        );
        warningErr.statusCode = 400;
        warningErr.activeCount = activeGrievancesCount;
        warningErr.requiresConfirmation = true;
        throw warningErr;
      }
    }

    const updates = { updated_at: new Date().toISOString() };
    if (description !== undefined) updates.description = description ? description.trim() : '';
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data, error } = await supabaseServer
      .from('departments')
      .update(updates)
      .eq('id', deptId)
      .select()
      .single();

    if (error) {
      console.error('[AdminService.updateDepartment] Error:', error.message);
      throw new Error('Failed to update department');
    }

    return data;
  }

  /**
   * 9. Get Paginated Grievances with Multifaceted Filters
   */
  static async getGrievances({
    page = 1,
    limit = 20,
    search = '',
    status = '',
    priority = '',
    department = '',
    assigned = '',
    from_date = '',
    to_date = '',
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    let query = supabaseServer
      .from('grievances')
      .select(
        'id, citizen_id, subject, description, category, department, location, preferred_language, status, priority, created_at, updated_at',
        { count: 'exact' }
      );

    if (status && ['submitted', 'in_progress', 'resolved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) {
      query = query.eq('priority', priority);
    }

    if (department && department.trim()) {
      query = query.eq('department', department.trim());
    }

    // Unassigned filter (department IS NULL)
    if (assigned === 'false' || assigned === false) {
      query = query.is('department', null);
    } else if (assigned === 'true' || assigned === true) {
      query = query.not('department', 'is', null);
    }

    if (from_date) {
      query = query.gte('created_at', from_date);
    }
    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`subject.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: grievances, count, error } = await query;

    if (error) {
      console.error('[AdminService.getGrievances] Error:', error.message);
      throw new Error('Failed to retrieve grievances');
    }

    // Hydrate citizen basic metadata safely
    if (grievances && grievances.length > 0) {
      const citizenIds = [...new Set(grievances.map((g) => g.citizen_id))];
      const { data: citizens } = await supabaseServer
        .from('profiles')
        .select('id, full_name, email, mobile_number')
        .in('id', citizenIds);

      const citizenMap = (citizens || []).reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});

      grievances.forEach((g) => {
        g.citizen = citizenMap[g.citizen_id] || { full_name: 'Unknown Citizen', email: '' };
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      grievances: grievances || [],
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
   * 10. Get Full Grievance Details for Admin Inspection
   */
  static async getGrievanceDetails(grievanceId) {
    const { data: grievance, error: fetchErr } = await supabaseServer
      .from('grievances')
      .select('*')
      .eq('id', grievanceId)
      .maybeSingle();

    if (fetchErr || !grievance) {
      const notFound = new Error('Grievance not found');
      notFound.statusCode = 404;
      throw notFound;
    }

    // 1. Citizen profile
    const { data: citizen } = await supabaseServer
      .from('profiles')
      .select('id, full_name, email, mobile_number, preferred_language')
      .eq('id', grievance.citizen_id)
      .maybeSingle();

    grievance.citizen = citizen || null;

    // 2. Status history
    const { data: statusHistory } = await supabaseServer
      .from('grievance_status_history')
      .select('id, old_status, new_status, notes, changed_at, changed_by')
      .eq('grievance_id', grievanceId)
      .order('changed_at', { ascending: true });

    grievance.status_history = statusHistory || [];

    // 3. AI routing history (all attempts chronologically)
    const { data: aiRoutings } = await supabaseServer
      .from('grievance_ai_routings')
      .select('*')
      .eq('grievance_id', grievanceId)
      .order('routed_at', { ascending: false });

    grievance.ai_routings = aiRoutings || [];

    // 4. Evidence attachments
    const attachments = await AttachmentService.getGrievanceAttachments(grievanceId);
    grievance.attachments = attachments || [];

    return grievance;
  }

  /**
   * 11. Get Paginated AI Routing Records
   */
  static async getAIRoutings({ page = 1, limit = 20, routing_status = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    let query = supabaseServer
      .from('grievance_ai_routings')
      .select(
        'id, grievance_id, predicted_department, confidence_score, routing_status, model_name, model_version, top_predictions, routed_at',
        { count: 'exact' }
      );

    if (routing_status && ['pending', 'completed', 'flagged_for_review', 'failed'].includes(routing_status)) {
      query = query.eq('routing_status', routing_status);
    }

    query = query
      .order('routed_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: routings, count, error } = await query;

    if (error) {
      console.error('[AdminService.getAIRoutings] Query error:', error.message);
      throw new Error('Failed to retrieve AI routing logs');
    }

    // Hydrate grievance subjects
    if (routings && routings.length > 0) {
      const grievanceIds = [...new Set(routings.map((r) => r.grievance_id))];
      const { data: grievances } = await supabaseServer
        .from('grievances')
        .select('id, subject, department, status')
        .in('id', grievanceIds);

      const map = (grievances || []).reduce((acc, g) => {
        acc[g.id] = g;
        return acc;
      }, {});

      routings.forEach((r) => {
        r.grievance = map[r.grievance_id] || { subject: 'Unknown Ticket', department: null, status: 'unknown' };
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      routings: routings || [],
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
   * 12. Manual Department Assignment by Administrator
   * Updates grievances.department, audits in grievance_status_history, preserves AI history
   */
  static async manualAssignDepartment(grievanceId, targetDepartment, adminId, reason = '') {
    if (!targetDepartment || !targetDepartment.trim()) {
      const err = new Error('Target department is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanDept = targetDepartment.trim();

    // 1. Verify that department exists and is active in public.departments
    const { data: deptRecord, error: deptErr } = await supabaseServer
      .from('departments')
      .select('name, is_active')
      .eq('name', cleanDept)
      .eq('is_active', true)
      .maybeSingle();

    if (deptErr || !deptRecord) {
      const err = new Error(`Cannot assign: "${cleanDept}" is not recognized as an active government department.`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch current grievance state
    const { data: existingGrievance, error: gErr } = await supabaseServer
      .from('grievances')
      .select('id, department, status')
      .eq('id', grievanceId)
      .maybeSingle();

    if (gErr || !existingGrievance) {
      const err = new Error('Grievance not found.');
      err.statusCode = 404;
      throw err;
    }

    const oldDept = existingGrievance.department || 'Unassigned';

    // 3. Update grievance department
    const { data: updatedGrievance, error: updateErr } = await supabaseServer
      .from('grievances')
      .update({
        department: cleanDept,
        updated_at: new Date().toISOString(),
      })
      .eq('id', grievanceId)
      .select()
      .single();

    if (updateErr) {
      console.error('[AdminService.manualAssignDepartment] Update error:', updateErr.message);
      throw new Error('Failed to update grievance department');
    }

    // 4. Record audit in grievance_status_history
    const auditNotes = reason
      ? `Manual Department Triage: Assigned from "${oldDept}" to "${cleanDept}" by Administrator. Reason: ${reason}`
      : `Manual Department Triage: Assigned from "${oldDept}" to "${cleanDept}" by Administrator.`;

    const { error: histErr } = await supabaseServer
      .from('grievance_status_history')
      .insert([
        {
          grievance_id: grievanceId,
          changed_by: adminId,
          old_status: existingGrievance.status,
          new_status: existingGrievance.status,
          notes: auditNotes,
          changed_at: new Date().toISOString(),
        },
      ]);

    if (histErr) {
      console.warn('[AdminService.manualAssignDepartment] Audit history warning:', histErr.message);
    }

    // 5. Phase 10 Notification: Citizen & Official manual assignment alert
    try {
      await NotificationService.notifyManualAssignment(updatedGrievance, cleanDept);
    } catch (notifErr) {
      console.warn('[AdminService.manualAssignDepartment] Notification warning:', notifErr.message);
    }

    return updatedGrievance;
  }
}
