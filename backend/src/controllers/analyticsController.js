import { AnalyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  /**
   * GET /api/admin/analytics/overview
   * Retrieves high-level grievance metrics, AI routing accuracy, and resolution time averages.
   */
  static async getOverview(req, res, next) {
    try {
      const { days } = req.query;
      const metrics = await AnalyticsService.getOverviewMetrics({ days });

      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  }
}
