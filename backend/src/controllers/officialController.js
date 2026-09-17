import { OfficialService } from '../services/officialService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ['submitted', 'in_progress', 'resolved', 'rejected'];

export class OfficialController {
  /**
   * GET /api/official/grievances
   * List grievances assigned to the official's department with optional filters
   */
  static async getGrievances(req, res, next) {
    try {
      const department = req.profile.department;
      const { status, priority, search } = req.query;

      const grievances = await OfficialService.getDepartmentGrievances(department, {
        status,
        priority,
        search,
      });

      return res.status(200).json({
        success: true,
        message: 'Department grievances retrieved successfully.',
        data: grievances,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/official/grievances/stats
   * Retrieve department dashboard statistics
   */
  static async getStats(req, res, next) {
    try {
      const department = req.profile.department;
      const stats = await OfficialService.getDepartmentStats(department);

      return res.status(200).json({
        success: true,
        message: 'Department statistics retrieved successfully.',
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/official/grievances/:id
   * Retrieve grievance detail and resolution timeline within the official's department
   */
  static async getGrievanceDetail(req, res, next) {
    try {
      const { id } = req.params;
      const department = req.profile.department;

      if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid grievance ticket ID format. Please provide a valid UUID.',
        });
      }

      const cleanId = id.trim();
      const grievance = await OfficialService.getGrievanceById(department, cleanId);

      if (!grievance) {
        return res.status(404).json({
          success: false,
          message: 'Grievance not found or you do not have authorization to view this department ticket.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Grievance detail retrieved successfully.',
        data: grievance,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/official/grievances/:id/status
   * Update the status of an assigned department grievance with audit notes
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const department = req.profile.department;
      const officialId = req.user.id;

      if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid grievance ticket ID format.',
        });
      }

      if (!status || typeof status !== 'string' || !VALID_STATUSES.includes(status.trim().toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
        });
      }

      const cleanId = id.trim();
      const cleanStatus = status.trim().toLowerCase();
      const cleanNotes = typeof notes === 'string' ? notes.trim() : '';

      const updated = await OfficialService.updateGrievanceStatus(
        officialId,
        department,
        cleanId,
        cleanStatus,
        cleanNotes
      );

      return res.status(200).json({
        success: true,
        message: `Grievance status updated to "${cleanStatus}" successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
