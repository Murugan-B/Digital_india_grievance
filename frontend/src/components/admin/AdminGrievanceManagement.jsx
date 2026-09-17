import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminEmptyState, AdminLoadingSkeleton, AdminErrorState } from './AdminStates';
import AdminGrievanceDetails from './AdminGrievanceDetails';

export default function AdminGrievanceManagement({ defaultAssigned = 'all', departments = [], onGrievanceUpdated }) {
  const [grievances, setGrievances] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState(defaultAssigned);

  // Detail Modal
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);
  const [detailedGrievance, setDetailedGrievance] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchGrievances = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getGrievances({
        page,
        limit: pagination.limit,
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
        department: departmentFilter,
        assigned: assignedFilter,
      });

      setGrievances(res.grievances);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load admin grievances:', err);
      setError(err.message || 'Failed to retrieve grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances(1);
  }, [statusFilter, priorityFilter, departmentFilter, assignedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGrievances(1);
  };

  const handleViewDetails = async (id) => {
    try {
      setSelectedGrievanceId(id);
      setDetailLoading(true);
      const data = await adminApi.getGrievanceById(id);
      setDetailedGrievance(data);
    } catch (err) {
      console.error('Failed to load grievance details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDetailsUpdated = () => {
    fetchGrievances(pagination.page);
    if (selectedGrievanceId) {
      handleViewDetails(selectedGrievanceId);
    }
    if (onGrievanceUpdated) onGrievanceUpdated();
  };

  const statusColors = {
    submitted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gov-800" />
            <span>Master Public Grievances Oversight</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Nation-wide grievance registry, automated classification audit, and departmental escalation.
          </p>
        </div>

        <button
          onClick={() => fetchGrievances(pagination.page)}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject, description, location..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
            />
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Assignment Filter */}
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          >
            <option value="all">Assigned & Unassigned</option>
            <option value="false">Only Unassigned (Pending AI/Manual)</option>
            <option value="true">Only Assigned</option>
          </select>
        </div>
      </div>

      {/* 3. Grievance Table */}
      {loading ? (
        <AdminLoadingSkeleton count={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={() => fetchGrievances(1)} />
      ) : grievances.length === 0 ? (
        <AdminEmptyState
          title="No Grievances Match Filters"
          message="Try broadening your search term or resetting the status and department filters."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ticket ID & Subject</th>
                  <th className="px-4 py-3">Citizen</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grievances.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                      <div className="font-bold text-slate-900 line-clamp-1">{g.subject}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {g.id}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{g.citizen?.full_name || 'Citizen'}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                        {g.citizen?.email}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {g.department ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gov-50 text-gov-900 border border-gov-200">
                          <Building2 className="w-3 h-3 mr-1" />
                          <span>{g.department}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <HelpCircle className="w-3 h-3 mr-1 text-amber-700" />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          statusColors[g.status] || 'bg-slate-100'
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="capitalize font-semibold text-slate-700">{g.priority}</span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(g.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleViewDetails(g.id)}
                        className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-gov-900 hover:text-white rounded-lg text-xs font-semibold text-slate-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {grievances.length} of {pagination.total} records (Page {pagination.page} of{' '}
              {pagination.totalPages || 1})
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchGrievances(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchGrievances(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailedGrievance && (
        <AdminGrievanceDetails
          grievance={detailedGrievance}
          availableDepartments={departments}
          onClose={() => setDetailedGrievance(null)}
          onDepartmentAssigned={handleDetailsUpdated}
        />
      )}
    </div>
  );
}
