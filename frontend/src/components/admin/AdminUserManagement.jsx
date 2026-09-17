import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminEmptyState, AdminLoadingSkeleton, AdminErrorState } from './AdminStates';

export default function AdminUserManagement({ currentAdminId }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getUsers({
        page,
        limit: pagination.limit,
        search: searchQuery,
        role: roleFilter,
        account_status: statusFilter,
      });

      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load user directory:', err);
      setError(err.message || 'Failed to retrieve user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatus = async (user, newStatus) => {
    if (user.id === currentAdminId) {
      alert('Security Protection: You cannot modify your own administrator account status.');
      return;
    }

    try {
      setActionLoading(user.id);
      await adminApi.updateUserStatus(user.id, newStatus);
      setToastMsg(`User ${user.full_name} status updated to ${newStatus}.`);
      fetchUsers(pagination.page);
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, account_status: newStatus });
      }
    } catch (err) {
      console.error('Status update failed:', err);
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-gov-800" />
            <span>Master User & Account Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive registry of citizen users, departmental officials, and security access states.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(pagination.page)}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          >
            <option value="all">All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="official">Officials</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* 3. User Table */}
      {loading ? (
        <AdminLoadingSkeleton count={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={() => fetchUsers(1)} />
      ) : users.length === 0 ? (
        <AdminEmptyState
          title="No Users Found"
          message="No user profiles match your filter criteria."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Full Name & Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department / Scope</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = u.id === currentAdminId;
                  const isActive = u.account_status === 'active';
                  const isSuspended = u.account_status === 'suspended';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{u.full_name}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-900'
                              : u.role === 'official'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {u.role === 'official' ? (
                          <div>
                            <span className="font-semibold text-gov-900">{u.department || 'Unassigned'}</span>
                            <div className="text-[10px] text-slate-400">{u.designation || 'Field Official'}</div>
                          </div>
                        ) : u.role === 'admin' ? (
                          <span className="text-[11px] font-semibold text-purple-800">Full System Oversight</span>
                        ) : (
                          <span className="text-slate-400">Citizen Redressal</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {u.mobile_number || 'N/A'}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.account_status === 'pending'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {!isSelf && (
                          <>
                            {isActive ? (
                              <button
                                onClick={() => handleToggleStatus(u, 'suspended')}
                                disabled={actionLoading === u.id}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-semibold transition"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(u, 'active')}
                                disabled={actionLoading === u.id}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold transition"
                              >
                                Activate
                              </button>
                            )}
                          </>
                        )}
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
              Showing {users.length} of {pagination.total} users (Page {pagination.page} of{' '}
              {pagination.totalPages || 1})
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
