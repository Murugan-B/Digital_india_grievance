import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Globe, 
  Layers, 
  Send, 
  Loader2, 
  ShieldCheck, 
  History, 
  FileText, 
  Building2, 
  Calendar 
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: {
    badge: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  in_progress: {
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  resolved: {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  rejected: {
    badge: 'bg-rose-100 text-rose-900 border-rose-200',
  },
};

export default function OfficialGrievanceDetails({
  grievance,
  onClose,
  onStatusUpdated,
  onUpdateStatus,
  updating = false
}) {
  const { t, tDept, tStatus, tPriority } = useLanguage();
  const [selectedNextStatus, setSelectedNextStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedModalImage, setSelectedModalImage] = useState(null);

  if (!grievance) return null;

  const currentStatus = grievance.status;

  // Determine allowed transitions based on workflow rules
  const availableTransitions = {
    submitted: [
      { value: 'in_progress', label: 'Mark as In Progress (Commence Investigation)' },
      { value: 'rejected', label: 'Reject Grievance (Out of Department Scope)' },
    ],
    in_progress: [
      { value: 'resolved', label: 'Mark as Resolved (Corrective Action Completed)' },
      { value: 'rejected', label: 'Reject Grievance (Invalid Claim)' },
    ],
    resolved: [],
    rejected: [],
  }[currentStatus] || [];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedNextStatus) {
      setErrorMsg('Please select a valid target status.');
      return;
    }

    try {
      await onUpdateStatus(grievance.id, selectedNextStatus, resolutionNotes);
      setSelectedNextStatus('');
      setResolutionNotes('');
    } catch (err) {
      console.error('[OfficialGrievanceDetails update error]:', err);
      setErrorMsg(err.message || 'Failed to update grievance status.');
    }
  };

  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.submitted;
  const history = grievance.status_history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gov-700 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-gov-300">
                  {grievance.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusInfo.badge}`}>
                  {tStatus(currentStatus)}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 truncate max-w-md sm:max-w-xl">
                {grievance.subject}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('common.department')}</span>
              <span className="font-bold text-slate-900">{tDept(grievance.department || 'Unassigned')}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('common.category')}</span>
              <span className="font-semibold text-slate-800">{tDept(grievance.category || 'General Civic')}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('common.priority')}</span>
              <span className="font-bold uppercase text-gov-900">{tPriority(grievance.priority || 'medium')}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('citizen.submitPage.langLabel')}</span>
              <span className="font-semibold uppercase text-slate-700">{grievance.preferred_language || 'EN'}</span>
            </div>
          </div>

          {/* Location & Dates */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('common.location')}: <strong className="text-slate-700">{grievance.location || t('common.noData')}</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('common.created')}: {new Date(grievance.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Detailed Grievance Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('official.details.grievanceInfo')}
            </h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {grievance.description}
            </div>
          </div>

          {/* Attached Evidence Section (Phase 12) */}
          {grievance.attachments && grievance.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('citizen.trackPage.evidenceTitle')} ({grievance.attachments.length})
              </h4>
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

          {/* Status Modification Workflow Form */}
          {availableTransitions.length > 0 ? (
            <form onSubmit={handleFormSubmit} className="p-5 bg-gov-50/70 rounded-2xl border border-gov-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-gov-800" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gov-900">
                    {t('official.details.updateStatusTitle')}
                  </h4>
                </div>
                <span className="text-[10px] text-gov-700 font-semibold">
                  {t('auth.roleOfficial')}
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('official.details.selectNewStatus')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="official-update-status-select"
                  value={selectedNextStatus}
                  onChange={(e) => setSelectedNextStatus(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-gov-600 font-medium"
                >
                  <option value="">-- {t('official.details.selectNewStatus')} --</option>
                  {availableTransitions.map((tr) => (
                    <option key={tr.value} value={tr.value}>
                      {tStatus(tr.value)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes TextArea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('official.details.statusNotesLabel')}
                </label>
                <textarea
                  id="official-update-notes-input"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={t('official.details.statusNotesPlaceholder')}
                  className="block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-gov-600"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  id="official-update-submit-btn"
                  disabled={updating}
                  className="inline-flex items-center px-5 py-2.5 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>{t('official.details.updating')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>{t('official.details.updateButton')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-600 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('official.details.terminalNotice')}</span>
            </div>
          )}

          {/* Status History Timeline */}
          {history.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <History className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Audit Log & Status History ({history.length})
                </h4>
              </div>

              <div className="space-y-2">
                {history.map((h, i) => (
                  <div 
                    key={h.id || i}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">
                          {(h.old_status || 'INITIAL').toUpperCase()} → <strong className="text-gov-900">{(h.new_status || 'UPDATED').toUpperCase()}</strong>
                        </span>
                        {h.notes && (
                          <span className="text-slate-500 italic">
                            "{h.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(h.changed_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
          >
            Close
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
