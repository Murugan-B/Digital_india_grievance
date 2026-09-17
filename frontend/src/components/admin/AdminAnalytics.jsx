import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  BrainCircuit,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Filter,
  RefreshCw,
  Info,
  ShieldCheck,
  Flame,
  PieChart,
} from 'lucide-react';
import { analyticsApi } from '../../lib/analyticsApi';

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (selectedDays = days, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await analyticsApi.getOverview({ days: selectedDays });
      setData(res);
    } catch (err) {
      console.error('[AdminAnalytics] Error loading metrics:', err);
      setError(err.message || 'Failed to retrieve analytics data from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  const totalGrievances = data?.totalGrievances || 0;
  const statusCounts = data?.statusCounts || { submitted: 0, in_progress: 0, resolved: 0, rejected: 0 };
  const priorityCounts = data?.priorityCounts || { urgent: 0, high: 0, medium: 0, low: 0 };
  const departmentCounts = data?.departmentCounts || {};
  const aiMetrics = data?.aiMetrics || {
    total_routings: 0,
    completed: 0,
    flagged_for_review: 0,
    failed: 0,
    completion_rate: 0,
    avg_confidence: 0,
  };
  const resolutionTime = data?.resolutionTime || {
    average_hours: null,
    average_days: null,
    sample_size: 0,
    formula: 'AVG(grievance_status_history.changed_at - grievances.created_at) WHERE new_status = "resolved"',
  };
  const trends = data?.trends || [];

  const maxTrendCount = trends.length > 0
    ? Math.max(...trends.map((t) => Math.max(t.submitted, t.resolved, 1)))
    : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Time Filter Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="p-1.5 rounded-lg bg-gov-100 text-gov-800">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              National Redressal Analytics & AI Performance
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time computed data from PostgreSQL grievances, Sentence-BERT AI routing audits, and departmental resolution histories.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            {[
              { label: '7D', value: 7 },
              { label: '14D', value: 14 },
              { label: '30D', value: 30 },
              { label: '90D', value: 90 },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDays(option.value)}
                className={`px-3 py-1 rounded-lg transition ${
                  days === option.value
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(days, true)}
            disabled={refreshing || loading}
            title="Recalculate live metrics"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-gov-700' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">Analytics Service Error</h3>
          <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchAnalytics(days)}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"
          >
            Retry Calculation
          </button>
        </div>
      ) : loading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-subtle">
          <RefreshCw className="w-8 h-8 text-gov-800 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">Computing Analytics Aggregations...</p>
          <p className="text-xs text-slate-500">Querying database status history, department distributions, and SBERT telemetry.</p>
        </div>
      ) : (
        <>
          {/* 2. Top-Level Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Grievances */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Grievances</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {totalGrievances.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                <span className="font-semibold text-slate-700">{data?.unassignedGrievances || 0}</span>
                <span>pending assignment ({totalGrievances > 0 ? ((data?.unassignedGrievances / totalGrievances) * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>

            {/* Card 2: AI Routing Completion Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">AI Accuracy Rate</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <BrainCircuit className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {aiMetrics.completion_rate}%
              </div>
              <div className="text-[11px] text-purple-700 flex items-center space-x-1 font-medium">
                <span>{aiMetrics.completed} auto-routed of {aiMetrics.total_routings} total attempts</span>
              </div>
            </div>

            {/* Card 3: Average Resolution Time */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Resolution Time</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {resolutionTime.average_hours !== null ? (
                  resolutionTime.average_hours < 24 ? (
                    `${resolutionTime.average_hours}h`
                  ) : (
                    `${resolutionTime.average_days} days`
                  )
                ) : (
                  <span className="text-lg text-slate-400 font-semibold">N/A (No data)</span>
                )}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                {resolutionTime.sample_size > 0
                  ? `Computed from ${resolutionTime.sample_size} resolved cases`
                  : 'Requires resolved grievance history'}
              </div>
            </div>

            {/* Card 4: Redressal Success Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Resolved Cases</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {statusCounts.resolved}
              </div>
              <div className="text-[11px] text-slate-500">
                {totalGrievances > 0
                  ? `${((statusCounts.resolved / totalGrievances) * 100).toFixed(1)}% overall resolution rate`
                  : 'No grievances recorded'}
              </div>
            </div>
          </div>

          {/* 3. Middle Section: Status & AI Performance Deep-Dives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-gov-800" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Grievance Status Distribution
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Live Sync</span>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'submitted',
                    label: 'Submitted (Awaiting Triage)',
                    count: statusCounts.submitted,
                    color: 'bg-amber-500',
                    badge: 'text-amber-700 bg-amber-50',
                  },
                  {
                    key: 'in_progress',
                    label: 'In Progress (Active Redressal)',
                    count: statusCounts.in_progress,
                    color: 'bg-blue-600',
                    badge: 'text-blue-700 bg-blue-50',
                  },
                  {
                    key: 'resolved',
                    label: 'Resolved (Closed Successfully)',
                    count: statusCounts.resolved,
                    color: 'bg-emerald-600',
                    badge: 'text-emerald-700 bg-emerald-50',
                  },
                  {
                    key: 'rejected',
                    label: 'Rejected (Non-Compliant / Void)',
                    count: statusCounts.rejected,
                    color: 'bg-red-600',
                    badge: 'text-red-700 bg-red-50',
                  },
                ].map((item) => {
                  const pct = totalGrievances > 0 ? ((item.count / totalGrievances) * 100).toFixed(1) : 0;
                  return (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900">{item.count}</span>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${item.badge}`}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Semantic Ticket Routing Intelligence */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-4 h-4 text-purple-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Sentence-BERT Semantic Routing Engine
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-100 text-purple-800">
                  Model: all-MiniLM-L6-v2
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="text-[11px] font-bold text-purple-800 uppercase">Auto-Routed</p>
                  <p className="text-2xl font-extrabold text-purple-950 mt-1">{aiMetrics.completed}</p>
                  <p className="text-[10px] text-purple-600 font-medium">Confidence &ge; 0.65</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-800 uppercase">Flagged Review</p>
                  <p className="text-2xl font-extrabold text-amber-950 mt-1">{aiMetrics.flagged_for_review}</p>
                  <p className="text-[10px] text-amber-600 font-medium">Confidence &lt; 0.65</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-700 uppercase">Mean Confidence</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {(aiMetrics.avg_confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Cosine Similarity</p>
                </div>
              </div>

              {/* Documentation Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <Info className="w-3.5 h-3.5 text-gov-700 shrink-0" />
                  <span>AI Performance Metric Formula</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Completion Rate = <span className="font-mono text-slate-700 font-semibold">(completed attempts / all routing attempts) &times; 100</span>.
                  Low confidence cases are held for nodal admin verification to safeguard ticket routing reliability.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Priority & Department Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Flame className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Priority Distribution
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'urgent', label: 'Urgent', count: priorityCounts.urgent, color: 'bg-red-500', text: 'text-red-700' },
                  { key: 'high', label: 'High', count: priorityCounts.high, color: 'bg-amber-500', text: 'text-amber-700' },
                  { key: 'medium', label: 'Medium', count: priorityCounts.medium, color: 'bg-blue-500', text: 'text-blue-700' },
                  { key: 'low', label: 'Low', count: priorityCounts.low, color: 'bg-slate-400', text: 'text-slate-700' },
                ].map((p) => {
                  const pct = totalGrievances > 0 ? ((p.count / totalGrievances) * 100).toFixed(1) : 0;
                  return (
                    <div key={p.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${p.text}`}>{p.label}</span>
                        <span className="font-extrabold text-slate-900">{p.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Workload Ranking */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gov-800" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Department Grievance Load
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {Object.keys(departmentCounts).length} Departments Active
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {Object.keys(departmentCounts).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No departmental assignments yet.</p>
                ) : (
                  Object.entries(departmentCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([dept, count]) => {
                      const pct = totalGrievances > 0 ? ((count / totalGrievances) * 100).toFixed(1) : 0;
                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800 truncate max-w-xs">{dept}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">{count} tickets</span>
                              <span className="text-[10px] text-slate-500 font-mono">({pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gov-700 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* 5. Daily Time-Series Trend */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-gov-800" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Grievance Inflow vs Redressal Trend ({days} Days)
                </h3>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gov-700 inline-block" />
                  <span className="text-slate-600 font-medium">Submitted</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-600 font-medium">Resolved</span>
                </div>
              </div>
            </div>

            {trends.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                No time-series data available for the selected {days}-day window.
              </div>
            ) : (
              <div className="pt-4 overflow-x-auto">
                <div className="min-w-[600px] h-48 flex items-end justify-between gap-2 px-2 border-b border-slate-200">
                  {trends.map((point) => {
                    const subHeight = Math.max(8, (point.submitted / maxTrendCount) * 100);
                    const resHeight = Math.max(8, (point.resolved / maxTrendCount) * 100);
                    const label = point.date ? point.date.slice(5) : '';

                    return (
                      <div key={point.date} className="flex-1 flex flex-col items-center group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow-md">
                          <p className="font-bold">{point.date}</p>
                          <p>Submitted: {point.submitted} | Resolved: {point.resolved}</p>
                        </div>

                        {/* Bars */}
                        <div className="w-full flex items-end justify-center gap-1 h-36">
                          <div
                            className="w-1/2 bg-gov-700 rounded-t-sm hover:bg-gov-800 transition-all"
                            style={{ height: `${point.submitted > 0 ? subHeight : 4}%` }}
                            title={`Submitted: ${point.submitted}`}
                          />
                          <div
                            className="w-1/2 bg-emerald-500 rounded-t-sm hover:bg-emerald-600 transition-all"
                            style={{ height: `${point.resolved > 0 ? resHeight : 4}%` }}
                            title={`Resolved: ${point.resolved}`}
                          />
                        </div>

                        {/* Date label */}
                        <span className="text-[10px] text-slate-500 font-mono mt-2 truncate max-w-full">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
