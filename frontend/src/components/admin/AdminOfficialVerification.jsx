import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminEmptyState, AdminLoadingSkeleton, AdminErrorState } from './AdminStates';

export default function AdminOfficialVerification({ onOfficialUpdated }) {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [confirmationAction, setConfirmationAction] = useState(null); // 'approve' | 'reject' | 'suspend'
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchOfficials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getUsers({
        role: 'official',
        account_status: statusFilter === 'all' ? '' : statusFilter,
        search: searchQuery,
        limit: 50,
      });
      setOfficials(res.users);
    } catch (err) {
      console.error('Failed to load officials for verification:', err);
      setError(err.message || 'Failed to retrieve officials list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficials();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOfficials();
  };

  const handleActionConfirm = async () => {
    if (!selectedOfficial || !confirmationAction) return;

    try {
      setActionLoading(selectedOfficial.id);
      await adminApi.verifyOfficial(selectedOfficial.id, confirmationAction);

      setFeedbackMsg({
        type: 'success',
        text: `Official ${selectedOfficial.full_name} has been ${
          confirmationAction === 'approve' ? 'approved (active)' : 'rejected/suspended'
        }.`,
      });

      setSelectedOfficial(null);
      setConfirmationAction(null);
      fetchOfficials();
      if (onOfficialUpdated) onOfficialUpdated();
    } catch (err) {
      console.error('Verification action failed:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to complete official verification action.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-gov-800" />
            <span>Government Official Verification Queue</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review official registrations, authorize department access, and manage administrative clearance.
          </p>
        </div>

        <button
          onClick={fetchOfficials}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'active', label: 'Verified Active' },
            { id: 'suspended', label: 'Suspended / Denied' },
            { id: 'all', label: 'All Officials' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, mobile..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          />
        </form>
      </div>

      {/* 3. Official List */}
      {loading ? (
        <AdminLoadingSkeleton count={4} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={fetchOfficials} />
      ) : officials.length === 0 ? (
        <AdminEmptyState
          title="No Officials in this Queue"
          message={`There are currently no official accounts with status "${statusFilter}".`}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Official Identity</th>
                  <th className="px-4 py-3">Department & Designation</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registration Date</th>
                  <th className="px-4 py-3 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officials.map((official) => {
                  const isPending = official.account_status === 'pending';
                  const isActive = official.account_status === 'active';
                  const isSuspended = official.account_status === 'suspended';

                  return (
                    <tr key={official.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{official.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{official.email}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gov-900 flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-gov-700 shrink-0" />
                          <span>{official.department || 'Not Assigned'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{official.designation || 'Field Official'}</div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="text-slate-600">{official.mobile_number || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">Lang: {official.preferred_language?.toUpperCase() || 'EN'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isPending ? 'Pending Review' : isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(official.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOfficial(official);
                                setConfirmationAction('approve');
                              }}
                              disabled={actionLoading === official.id}
                              className="inline-flex items-center px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedOfficial(official);
                                setConfirmationAction('reject');
                              }}
                              disabled={actionLoading === official.id}
                              className="inline-flex items-center px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Deny</span>
                            </button>
                          </>
                        )}

                        {isActive && (
                          <button
                            onClick={() => {
                              setSelectedOfficial(official);
                              setConfirmationAction('suspend');
                            }}
                            disabled={actionLoading === official.id}
                            className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                            <span>Suspend</span>
                          </button>
                        )}

                        {isSuspended && (
                          <button
                            onClick={() => {
                              setSelectedOfficial(official);
                              setConfirmationAction('approve');
                            }}
                            disabled={actionLoading === official.id}
                            className="inline-flex items-center px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            <span>Re-Activate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedOfficial && confirmationAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-gov border border-slate-200">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmationAction === 'approve'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Official {confirmationAction === 'approve' ? 'Approval' : 'Suspension'}
                </h3>
                <p className="text-xs text-slate-500">Departmental Access Control</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p><strong>Official Name:</strong> {selectedOfficial.full_name}</p>
              <p><strong>Official Email:</strong> {selectedOfficial.email}</p>
              <p><strong>Assigned Department:</strong> {selectedOfficial.department || 'None'}</p>
              <p><strong>Designation:</strong> {selectedOfficial.designation || 'Field Official'}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmationAction === 'approve'
                ? 'Approving this official will grant immediate access to triage grievances for their assigned department.'
                : 'Denying or suspending this official will immediately revoke access to departmental grievance queues.'}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setSelectedOfficial(null);
                  setConfirmationAction(null);
                }}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>

              <button
                onClick={handleActionConfirm}
                disabled={actionLoading !== null}
                className={`inline-flex items-center px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition ${
                  confirmationAction === 'approve'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                <span>
                  Confirm {confirmationAction === 'approve' ? 'Approval' : 'Action'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
