import { AdminService } from '../services/adminService.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AdminController {
  /**
   * GET /api/admin/stats
   */
  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getSystemStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/users
   */
  static async getUsers(req, res, next) {
    try {
      const { page, limit, search, role, account_status } = req.query;
      const result = await AdminService.getUsers({
        page,
        limit,
        search,
        role,
        account_status,
      });

      return res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format.',
        });
      }

      const user = await AdminService.getUserById(id);
      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   */
  static async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { account_status } = req.body;

      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format.',
        });
      }

      if (!account_status || !['active', 'pending', 'suspended'].includes(account_status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid account_status (active, pending, suspended) is required.',
        });
      }

      const updatedUser = await AdminService.updateUserStatus(id, account_status, req.user.id);
      return res.status(200).json({
        success: true,
        message: `User account status updated to ${account_status}.`,
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/users/:id/verification
   */
  static async verifyOfficial(req, res, next) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format.',
        });
      }

      if (!action || !['approve', 'reject', 'suspend'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Valid action (approve, reject, suspend) is required.',
        });
      }

      const verifiedOfficial = await AdminService.verifyOfficial(id, action, req.user.id);
      return res.status(200).json({
        success: true,
        message: `Official verification action "${action}" completed successfully.`,
        data: verifiedOfficial,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/departments
   */
  static async getDepartments(req, res, next) {
    try {
      const { search, is_active } = req.query;
      const departments = await AdminService.getDepartments({ search, is_active });
      return res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/departments
   */
  static async createDepartment(req, res, next) {
    try {
      const { name, code, description } = req.body;
      const newDept = await AdminService.createDepartment({ name, code, description });
      return res.status(201).json({
        success: true,
        message: 'Department registered successfully.',
        data: newDept,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/departments/:id
   */
  static async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const { description, is_active, force } = req.body;

      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID format.',
        });
      }

      const updatedDept = await AdminService.updateDepartment(id, { description, is_active, force });
      return res.status(200).json({
        success: true,
        message: 'Department updated successfully.',
        data: updatedDept,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/grievances
   */
  static async getGrievances(req, res, next) {
    try {
      const { page, limit, search, status, priority, department, assigned, from_date, to_date } = req.query;
      const result = await AdminService.getGrievances({
        page,
        limit,
        search,
        status,
        priority,
        department,
        assigned,
        from_date,
        to_date,
      });

      return res.status(200).json({
        success: true,
        data: result.grievances,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/grievances/:id
   */
  static async getGrievanceById(req, res, next) {
    try {
      const { id } = req.params;
      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid grievance ID format.',
        });
      }

      const grievance = await AdminService.getGrievanceDetails(id);
      return res.status(200).json({
        success: true,
        data: grievance,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/ai-routings
   */
  static async getAIRoutings(req, res, next) {
    try {
      const { page, limit, routing_status } = req.query;
      const result = await AdminService.getAIRoutings({ page, limit, routing_status });
      return res.status(200).json({
        success: true,
        data: result.routings,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/ai-routings/flagged
   */
  static async getFlaggedAIRoutings(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getAIRoutings({
        page,
        limit,
        routing_status: 'flagged_for_review',
      });
      return res.status(200).json({
        success: true,
        data: result.routings,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/grievances/:id/department
   */
  static async manualAssignDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const { department, reason } = req.body;

      if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid grievance ID format.',
        });
      }

      if (!department || typeof department !== 'string' || !department.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Department is required for manual assignment.',
        });
      }

      const updated = await AdminService.manualAssignDepartment(
        id,
        department.trim(),
        req.user.id,
        reason ? reason.trim() : ''
      );

      return res.status(200).json({
        success: true,
        message: `Grievance successfully assigned to "${department.trim()}".`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
