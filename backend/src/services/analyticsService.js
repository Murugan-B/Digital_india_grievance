import { supabaseServer } from '../config/supabase.js';

export class AnalyticsService {
  /**
   * 1. Master Analytics Overview
   */
  static async getOverviewMetrics({ days = 30 } = {}) {
    const windowDays = Math.min(365, Math.max(7, parseInt(days, 10) || 30));
    const startDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch all grievances with created_at, status, priority, department
    const { data: grievances, error: gErr } = await supabaseServer
      .from('grievances')
      .select('id, status, priority, department, created_at, updated_at');

    if (gErr) {
      console.error('[AnalyticsService.getOverviewMetrics] Grievance query error:', gErr.message);
      throw new Error('Failed to retrieve grievance data for analytics');
    }

    const allGrievances = grievances || [];
    const totalGrievances = allGrievances.length;

    // 2. Status Breakdown
    const statusCounts = {
      submitted: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    };

    let unassignedGrievancesCount = 0;

    const priorityCounts = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    };

    const departmentMap = {};

    allGrievances.forEach((g) => {
      // Status count
      if (statusCounts[g.status] !== undefined) {
        statusCounts[g.status]++;
      }

      // Priority count
      if (priorityCounts[g.priority] !== undefined) {
        priorityCounts[g.priority]++;
      }

      // Department breakdown
      const deptName = g.department || 'Unassigned';
      if (!departmentMap[deptName]) {
        departmentMap[deptName] = { total: 0, resolved: 0, in_progress: 0, submitted: 0, rejected: 0 };
      }
      departmentMap[deptName].total++;
      if (g.status === 'resolved') departmentMap[deptName].resolved++;
      else if (g.status === 'in_progress') departmentMap[deptName].in_progress++;
      else if (g.status === 'submitted') departmentMap[deptName].submitted++;
      else if (g.status === 'rejected') departmentMap[deptName].rejected++;

      if (!g.department) {
        unassignedGrievancesCount++;
      }
    });

    const departmentDistribution = Object.keys(departmentMap).map((name) => ({
      name,
      ...departmentMap[name],
      resolutionRate:
        departmentMap[name].total > 0
          ? Number(((departmentMap[name].resolved / departmentMap[name].total) * 100).toFixed(1))
          : 0,
    }));

    // 3. AI Semantic Routing Metrics
    const { data: aiRoutings, error: aiErr } = await supabaseServer
      .from('grievance_ai_routings')
      .select('routing_status, confidence_score, routed_at');

    let totalAIRoutings = 0;
    let completedAIRoutings = 0;
    let flaggedAIRoutings = 0;
    let failedAIRoutings = 0;
    let confidenceSum = 0;

    if (aiRoutings && aiRoutings.length > 0) {
      totalAIRoutings = aiRoutings.length;
      aiRoutings.forEach((r) => {
        confidenceSum += Number(r.confidence_score) || 0;
        if (r.routing_status === 'completed') completedAIRoutings++;
        else if (r.routing_status === 'flagged_for_review') flaggedAIRoutings++;
        else if (r.routing_status === 'failed') failedAIRoutings++;
      });
    }

    const aiCompletionRate =
      totalAIRoutings > 0
        ? Number(((completedAIRoutings / totalAIRoutings) * 100).toFixed(1))
        : 0;

    const avgConfidenceScore =
      totalAIRoutings > 0
        ? Number((confidenceSum / totalAIRoutings).toFixed(4))
        : 0;

    // 4. Average Resolution Time Calculation (using grievance_status_history where new_status = 'resolved')
    const { data: resolutionEvents, error: histErr } = await supabaseServer
      .from('grievance_status_history')
      .select('grievance_id, changed_at, new_status')
      .eq('new_status', 'resolved');

    let avgResolutionHours = null;
    let avgResolutionDays = null;
    let resolvedGrievancesCount = 0;

    if (resolutionEvents && resolutionEvents.length > 0) {
      // Map each resolved grievance to its earliest resolution timestamp
      const resolutionMap = {};
      resolutionEvents.forEach((ev) => {
        if (!resolutionMap[ev.grievance_id] || new Date(ev.changed_at) < new Date(resolutionMap[ev.grievance_id])) {
          resolutionMap[ev.grievance_id] = ev.changed_at;
        }
      });

      let totalDurationMs = 0;
      allGrievances.forEach((g) => {
        if (g.status === 'resolved' && resolutionMap[g.id]) {
          const createdAt = new Date(g.created_at).getTime();
          const resolvedAt = new Date(resolutionMap[g.id]).getTime();
          const duration = Math.max(0, resolvedAt - createdAt);
          totalDurationMs += duration;
          resolvedGrievancesCount++;
        }
      });

      if (resolvedGrievancesCount > 0) {
        const avgMs = totalDurationMs / resolvedGrievancesCount;
        avgResolutionHours = Number((avgMs / (1000 * 60 * 60)).toFixed(1));
        avgResolutionDays = Number((avgResolutionHours / 24).toFixed(1));
      }
    }

    // 5. Time Trends: Daily Influx & Resolutions over windowDays
    const trendMap = {};
    for (let i = 0; i < windowDays; i++) {
      const d = new Date(Date.now() - (windowDays - 1 - i) * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      trendMap[dateKey] = { date: dateKey, submitted: 0, resolved: 0 };
    }

    allGrievances.forEach((g) => {
      const dateKey = g.created_at.split('T')[0];
      if (trendMap[dateKey]) {
        trendMap[dateKey].submitted++;
      }
    });

    if (resolutionEvents) {
      resolutionEvents.forEach((ev) => {
        const dateKey = ev.changed_at.split('T')[0];
        if (trendMap[dateKey]) {
          trendMap[dateKey].resolved++;
        }
      });
    }

    const timeTrends = Object.values(trendMap);

    const departmentCounts = {};
    departmentDistribution.forEach((d) => {
      if (d.name !== 'Unassigned') {
        departmentCounts[d.name] = d.total;
      }
    });

    return {
      windowDays,
      totalGrievances,
      statusCounts,
      unassignedGrievances: unassignedGrievancesCount,
      priorityCounts,
      departmentCounts,
      departmentDistribution,
      aiMetrics: {
        total_routings: totalAIRoutings,
        totalAttempts: totalAIRoutings,
        completed: completedAIRoutings,
        flagged_for_review: flaggedAIRoutings,
        flaggedForReview: flaggedAIRoutings,
        failed: failedAIRoutings,
        completion_rate: aiCompletionRate,
        completionRate: aiCompletionRate,
        avg_confidence: avgConfidenceScore,
        averageConfidence: avgConfidenceScore,
        confidenceThreshold: 0.65,
        modelName: 'sentence-transformers/all-MiniLM-L6-v2',
        formula: 'completionRate = (completed / totalAttempts) * 100',
      },
      resolutionTime: {
        average_hours: avgResolutionHours,
        average_days: avgResolutionDays,
        sample_size: resolvedGrievancesCount,
        formula: 'AVG(grievance_status_history.changed_at - grievances.created_at) WHERE new_status = "resolved"',
      },
      resolutionPerformance: {
        resolvedCount: resolvedGrievancesCount,
        averageResolutionHours: avgResolutionHours,
        averageResolutionDays: avgResolutionDays,
        benchmarkDays: 7, // Government Service Charter Standard
        formula: 'AVG(grievance_status_history.changed_at - grievances.created_at) WHERE new_status = "resolved"',
      },
      trends: timeTrends,
      timeTrends,
      grievanceMetrics: {
        total: totalGrievances,
        ...statusCounts,
        resolutionRate:
          totalGrievances > 0
            ? Number(((statusCounts.resolved / totalGrievances) * 100).toFixed(1))
            : 0,
      },
      priorityMetrics: priorityCounts,
      departmentMetrics: departmentDistribution,
      generatedAt: new Date().toISOString(),
    };
  }
}
