import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminEmptyState, AdminLoadingSkeleton, AdminErrorState } from './AdminStates';

export default function AdminDepartmentManagement({ departments = [], loading = false, error = null, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [dependencyWarning, setDependencyWarning] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const filteredDepartments = departments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setFormError('Department name and code are required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await adminApi.createDepartment({
        name: formName.trim(),
        code: formCode.trim(),
        description: formDescription.trim(),
      });

      setSuccessToast(`Department "${formName}" registered successfully.`);
      setCreateModalOpen(false);
      setFormName('');
      setFormCode('');
      setFormDescription('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Department creation failed:', err);
      setFormError(err.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (dept, force = false) => {
    try {
      setSubmitting(true);
      const nextActive = !dept.is_active;

      await adminApi.updateDepartment(dept.id, {
        is_active: nextActive,
        force,
      });

      setSuccessToast(
        `Department "${dept.name}" has been ${nextActive ? 'activated' : 'deactivated'}.`
      );
      setDependencyWarning(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.data?.requiresConfirmation || err.requiresConfirmation) {
        setDependencyWarning({
          dept,
          message: err.message,
        });
      } else {
        alert(err.message || 'Failed to update department status.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDept) return;

    try {
      setSubmitting(true);
      setFormError(null);
      await adminApi.updateDepartment(editDept.id, {
        description: formDescription.trim(),
      });

      setSuccessToast(`Department "${editDept.name}" description updated.`);
      setEditDept(null);
      setFormDescription('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Department update failed:', err);
      setFormError(err.message || 'Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-gov-800" />
            <span>Government Departments Catalogue</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage official departments, jurisdiction boundaries, and AI semantic classification targets.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}

          <button
            onClick={() => {
              setFormError(null);
              setFormName('');
              setFormCode('');
              setFormDescription('');
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gov-900 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Search */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-subtle flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments or scope..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
          />
        </div>

        <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
          {filteredDepartments.length} Department{filteredDepartments.length !== 1 ? 's' : ''} Listed
        </span>
      </div>

      {/* 3. Departments Grid */}
      {loading ? (
        <AdminLoadingSkeleton count={4} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={onRefresh} />
      ) : filteredDepartments.length === 0 ? (
        <AdminEmptyState
          title="No Departments Found"
          message="No departments matching your query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className={`bg-white rounded-xl p-5 border shadow-subtle flex flex-col justify-between space-y-4 transition ${
                dept.is_active ? 'border-slate-200' : 'border-slate-300 opacity-70 bg-slate-50/70'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      dept.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {dept.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {dept.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-500">
                  Active Grievances: <strong>{dept.active_grievances_count || 0}</strong>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditDept(dept);
                      setFormDescription(dept.description || '');
                      setFormError(null);
                    }}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Description"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleActive(dept)}
                    disabled={submitting}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      dept.is_active
                        ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                        : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {dept.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-gov border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-gov-800" />
              <span>Register New Department</span>
            </h3>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Forest & Wildlife"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Unique Code *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. FOREST"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Scope & Jurisdiction Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detail the services and grievance types handled by this department for SBERT semantic matching..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 bg-gov-900 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-gov border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Edit {editDept.name} ({editDept.code})
            </h3>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Jurisdiction & Scope Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDept(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 bg-gov-900 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  <span>Update Scope</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivation Dependency Warning Modal */}
      {dependencyWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-gov border border-amber-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Grievances Dependency</h3>
                <p className="text-xs text-slate-500">Deactivation Confirmation Warning</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {dependencyWarning.message}
            </p>

            <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Deactivating will exclude this department from future AI routing predictions. Existing assigned tickets will remain with this department name for historical tracking.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDependencyWarning(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleActive(dependencyWarning.dept, true)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Proceed with Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
