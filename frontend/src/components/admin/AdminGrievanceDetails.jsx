import React, { useState } from 'react';
import {
  X,
  FileText,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  History,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';

export default function AdminGrievanceDetails({ grievance, onClose, onDepartmentAssigned, availableDepartments = [] }) {
  const [assigning, setAssigning] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedModalImage, setSelectedModalImage] = useState(null);

  if (!grievance) return null;

  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!selectedDept) {
      setErrorMsg('Please select an active target department.');
      return;
    }

    try {
      setAssigning(true);
      setErrorMsg(null);
      await adminApi.manualAssignDepartment(grievance.id, selectedDept, assignReason);
      setSuccessMsg(`Grievance successfully assigned to "${selectedDept}".`);
      if (onDepartmentAssigned) onDepartmentAssigned();
    } catch (err) {
      console.error('Manual assignment failed:', err);
      setErrorMsg(err.message || 'Failed to assign department.');
    } finally {
      setAssigning(false);
    }
  };

  const statusColors = {
    submitted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-amber-100 text-amber-900 font-bold',
    urgent: 'bg-red-100 text-red-900 font-extrabold animate-pulse',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-gov border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gov-800 text-white flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Grievance Audit Dossier</h2>
              <p className="text-[11px] text-slate-500 font-mono">ID: {grievance.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold">
              {successMsg}
            </div>
          )}

          {/* 1. Grievance Core Information */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[grievance.status] || 'bg-slate-100'}`}>
                {grievance.status?.toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[grievance.priority] || 'bg-slate-100'}`}>
                Priority: {grievance.priority}
              </span>
              {grievance.department ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gov-50 text-gov-900 border border-gov-200 flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span>{grievance.department}</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Unassigned / Pending Review
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900">{grievance.subject}</h3>
            <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
              {grievance.description}
            </p>

            {/* Attached Evidence Section (Phase 12) */}
            {grievance.attachments && grievance.attachments.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="block font-bold text-slate-500 uppercase text-[10px]">
                  Attached Evidence ({grievance.attachments.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {grievance.attachments.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      onClick={() => setSelectedModalImage(att.signed_url)}
                      className="group relative bg-slate-50 border border-slate-200 rounded-xl p-2 cursor-pointer hover:border-gov-600 hover:bg-slate-100/80 transition shadow-2xs"
                    >
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                        <img
                          src={att.signed_url}
                          alt={att.original_file_name || 'Evidence'}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-700 truncate mt-1.5" title={att.original_file_name}>
                        {att.original_file_name || `Attachment ${idx + 1}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-[11px]">
            <div>
              <span className="block font-bold text-slate-400 uppercase">Citizen Name</span>
              <span className="font-semibold text-slate-800">{grievance.citizen?.full_name || 'N/A'}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-400 uppercase">Contact Email</span>
              <span className="font-mono text-slate-800 truncate block">{grievance.citizen?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-400 uppercase">Location / Ward</span>
              <span className="font-semibold text-slate-800">{grievance.location || 'N/A'}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-400 uppercase">Submitted On</span>
              <span className="text-slate-800">
                {new Date(grievance.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          {/* 3. Manual Assignment Control (Available if unassigned or re-assigning) */}
          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
            <h4 className="font-bold text-blue-950 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-blue-800" />
              <span>Administrative Department Assignment</span>
            </h4>

            <form onSubmit={handleManualAssign} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Select Target Department *
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-gov-800"
                  >
                    <option value="">-- Choose Active Department --</option>
                    {availableDepartments
                      .filter((d) => d.is_active)
                      .map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Administrative Reason (Audited)
                  </label>
                  <input
                    type="text"
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    placeholder="e.g., Manually classified following AI review"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-gov-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={assigning || !selectedDept}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gov-900 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Assign & Update Grievance</span>
              </button>
            </form>
          </div>

          {/* 4. AI Routing Predictions History (Phase 8 Audit Trail) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
              <BrainCircuit className="w-4 h-4 text-purple-700" />
              <span>Sentence-BERT AI Semantic Routing History</span>
            </h4>

            {grievance.ai_routings?.length === 0 ? (
              <p className="text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No automated AI semantic classification attempts recorded.
              </p>
            ) : (
              <div className="space-y-2">
                {grievance.ai_routings?.map((ai) => (
                  <div
                    key={ai.id}
                    className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-purple-950 text-xs">
                          Predicted: {ai.predicted_department}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-200/60 text-purple-900">
                          Score: {Number(ai.confidence_score).toFixed(4)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ai.routing_status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {ai.routing_status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ai.routed_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Top-K predictions list */}
                    {ai.top_predictions && ai.top_predictions.length > 0 && (
                      <div className="pt-1.5 border-t border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {ai.top_predictions.map((p, idx) => (
                          <div key={idx} className="p-1.5 bg-white/70 rounded-md border border-purple-100 text-[10px]">
                            <span className="font-bold text-slate-800">{idx + 1}. {p.department}</span>
                            <span className="float-right font-mono text-purple-700">{p.score}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Phase 7 Departmental Status Transition History */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
              <History className="w-4 h-4 text-gov-800" />
              <span>Departmental Status Transition Audit Log</span>
            </h4>

            {grievance.status_history?.length === 0 ? (
              <p className="text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No status transitions recorded yet.
              </p>
            ) : (
              <div className="border-l-2 border-slate-200 ml-2 space-y-4 pl-4 py-1">
                {grievance.status_history?.map((h) => (
                  <div key={h.id} className="relative space-y-1">
                    <div className="w-2.5 h-2.5 bg-gov-800 rounded-full absolute -left-[21px] top-1" />
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">
                        {h.old_status} &rarr; {h.new_status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.changed_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    {h.notes && (
                      <p className="text-slate-600 italic text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{h.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedModalImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedModalImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl p-2 shadow-2xl">
            <button
              onClick={() => setSelectedModalImage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedModalImage}
              alt="Evidence preview"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
}
