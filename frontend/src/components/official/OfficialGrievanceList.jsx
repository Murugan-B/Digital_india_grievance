import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  MapPin, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Building2, 
  ChevronRight 
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
  },
  in_progress: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
  },
  resolved: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  rejected: {
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
  },
};

const PRIORITY_CONFIG = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-slate-100 text-slate-700 border-slate-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function OfficialGrievanceList({
  grievances = [],
  loading = false,
  onSelectGrievance,
  departmentName = 'Department'
}) {
  const { t, tDept, tStatus, tPriority } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const filteredGrievances = useMemo(() => {
    return grievances.filter((item) => {
      // 1. Status Filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      // 2. Priority Filter
      if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
        return false;
      }
      // 3. Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchSubject = item.subject?.toLowerCase().includes(query);
        const matchCategory = item.category?.toLowerCase().includes(query);
        const matchId = item.id?.toLowerCase().includes(query);
        const matchLocation = item.location?.toLowerCase().includes(query);
        return matchSubject || matchCategory || matchId || matchLocation;
      }
      return true;
    });
  }, [grievances, selectedStatus, selectedPriority, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden space-y-4">
      
      {/* Search & Filter Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Department Grievance Triage Queue
            </h2>
            <p className="text-xs text-slate-500">
              Assigned to <strong>{departmentName}</strong> • {filteredGrievances.length} ticket(s) found
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="official-search-grievances"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="block w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-gov-600 focus:border-gov-600"
            />
          </div>

          {/* Status Dropdown */}
          <div className="sm:col-span-3">
            <select
              id="official-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-gov-600"
            >
              <option value="all">{t('common.all')} {t('common.status')}</option>
              <option value="submitted">{t('status.submitted')}</option>
              <option value="in_progress">{t('status.in_progress')}</option>
              <option value="resolved">{t('status.resolved')}</option>
              <option value="rejected">{t('status.rejected')}</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="sm:col-span-3">
            <select
              id="official-priority-filter"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-gov-600"
            >
              <option value="all">{t('common.all')} {t('common.priority')}</option>
              <option value="urgent">{t('priority.urgent')}</option>
              <option value="high">{t('priority.high')}</option>
              <option value="normal">{t('priority.medium')}</option>
              <option value="low">{t('priority.low')}</option>
            </select>
          </div>

        </div>
      </div>

      {/* Content: Table for Desktop / Cards for Mobile */}
      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-gov-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">{t('common.loading')}</p>
        </div>
      ) : filteredGrievances.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{t('common.noData')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t('citizen.noGrievancesYet')}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('official.table.ticketId')}</th>
                  <th className="py-3 px-4">{t('official.table.subject')}</th>
                  <th className="py-3 px-4">{t('official.table.category')}</th>
                  <th className="py-3 px-4">{t('official.table.date')}</th>
                  <th className="py-3 px-4">{t('official.table.priority')}</th>
                  <th className="py-3 px-4">{t('official.table.status')}</th>
                  <th className="py-3 px-4 text-right">{t('official.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGrievances.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
                  const priorityClass = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {item.id.substring(0, 8)}...
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">
                          {item.subject}
                        </p>
                        {item.location && (
                          <p className="text-[11px] text-slate-500 flex items-center mt-0.5 truncate">
                            <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                            <span>{item.location}</span>
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {tDept(item.category || 'General Civic')}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityClass}`}>
                          {tPriority(item.priority || 'normal')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dot}`} />
                          {tStatus(item.status || 'submitted')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectGrievance(item)}
                          id={`official-view-ticket-${item.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-gov-900 hover:bg-gov-950 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>{t('official.table.action')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredGrievances.map((item) => {
              const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
              const priorityClass = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;

              return (
                <div 
                  key={item.id} 
                  onClick={() => onSelectGrievance(item)}
                  className="p-4 space-y-2.5 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.id.substring(0, 8)}...
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {item.subject}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>Category: <strong>{item.category || 'General'}</strong></span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase border ${priorityClass}`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
