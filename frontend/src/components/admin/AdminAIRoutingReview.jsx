import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Search,
  Eye,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminEmptyState, AdminLoadingSkeleton, AdminErrorState } from './AdminStates';
import AdminGrievanceDetails from './AdminGrievanceDetails';

export default function AdminAIRoutingReview({ departments = [], onRoutingUpdated }) {
  const [routings, setRoutings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('flagged_for_review'); // default flagged
  const [inspectGrievance, setInspectGrievance] = useState(null);

  const fetchRoutings = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getAIRoutings({
        page,
        limit: pagination.limit,
        routing_status: filterStatus === 'all' ? '' : filterStatus,
      });
      setRoutings(res.routings);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load AI routings:', err);
      setError(err.message || 'Failed to retrieve AI routing logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutings(1);
  }, [filterStatus]);

  const handleInspectTicket = async (grievanceId) => {
    try {
      const data = await adminApi.getGrievanceById(grievanceId);
      setInspectGrievance(data);
    } catch (err) {
      console.error('Failed to load grievance details:', err);
    }
  };

  const handleAssigned = () => {
    fetchRoutings(pagination.page);
    if (inspectGrievance) {
      handleInspectTicket(inspectGrievance.id);
    }
    if (onRoutingUpdated) onRoutingUpdated();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-purple-700" />
            <span>Sentence-BERT AI Semantic Routing Oversight</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit automated cosine similarity rankings, inspect low-confidence classifications, and perform human-in-the-loop triage.
          </p>
        </div>

        <button
          onClick={() => fetchRoutings(pagination.page)}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh AI Logs</span>
        </button>
      </div>

      {/* 2. Educational / Confidence Threshold Banner */}
      <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-xl flex items-start space-x-3 text-xs text-purple-950">
        <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Automated Routing Policy: Configured Threshold = 0.65 (Cosine Similarity)
          </p>
          <p className="text-purple-800 leading-relaxed">
            High-confidence predictions (score &ge; 0.65) are automatically routed and assigned to departmental queues.
            Predictions with similarity &lt; 0.65 or ambiguous content are marked <strong>flagged_for_review</strong> and remain safely unassigned until administrative confirmation.
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-subtle flex items-center space-x-2">
        {[
          { id: 'flagged_for_review', label: 'Flagged for Review (Score < 0.65)' },
          { id: 'completed', label: 'Completed Auto-Assignments' },
          { id: 'all', label: 'All AI Routing Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === tab.id
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Routing Table */}
      {loading ? (
        <AdminLoadingSkeleton count={4} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={() => fetchRoutings(1)} />
      ) : routings.length === 0 ? (
        <AdminEmptyState
          title="No AI Routing Logs in this Queue"
          message={`No logs matching status "${filterStatus}".`}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Grievance Subject</th>
                  <th className="px-4 py-3">Predicted Department</th>
                  <th className="px-4 py-3">Confidence Score</th>
                  <th className="px-4 py-3">Top Candidates (Similarity)</th>
                  <th className="px-4 py-3">Routing Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Human Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routings.map((r) => {
                  const score = Number(r.confidence_score);
                  const isFlagged = r.routing_status === 'flagged_for_review';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-sm">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {r.grievance?.subject || 'Citizen Grievance'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {r.grievance_id}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-purple-950">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span>{r.predicted_department}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono font-bold text-xs ${
                              score >= 0.65 ? 'text-emerald-700' : 'text-amber-800'
                            }`}
                          >
                            {score.toFixed(4)}
                          </span>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score >= 0.65 ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, score * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col space-y-0.5">
                          {(r.top_predictions || []).slice(0, 2).map((p, idx) => (
                            <div key={idx} className="text-[10px] text-slate-600 flex items-center justify-between gap-2 max-w-[180px]">
                              <span className="truncate">{p.department}</span>
                              <span className="font-mono text-slate-400">{p.score}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isFlagged
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isFlagged ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1 text-amber-700" />
                              <span>Flagged for Review</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-700" />
                              <span>Auto-Assigned</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(r.routed_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleInspectTicket(r.grievance_id)}
                          className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-purple-900 hover:text-white rounded-lg text-xs font-semibold text-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Review & Triage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {routings.length} of {pagination.total} records (Page {pagination.page} of{' '}
              {pagination.totalPages || 1})
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchRoutings(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchRoutings(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Triage Modal */}
      {inspectGrievance && (
        <AdminGrievanceDetails
          grievance={inspectGrievance}
          availableDepartments={departments}
          onClose={() => setInspectGrievance(null)}
          onDepartmentAssigned={handleAssigned}
        />
      )}
    </div>
  );
}
