import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { 
  Search, 
  FileSearch, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Circle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  Building,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TrackGrievance() {
  const { t, tDept, tStatus, tPriority } = useLanguage();
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [grievance, setGrievance] = useState(null);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState(null);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setGrievance(null);

    const cleanId = ticketId.trim();
    if (!cleanId) {
      setError('Please enter a valid Grievance Ticket ID.');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const data = await api.getGrievanceById(cleanId);
      setGrievance(data);
    } catch (err) {
      console.error('[TrackGrievance error]:', err);
      setError(err.message || 'Grievance ticket not found or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const getMilestones = (status) => {
    const isResolved = status === 'resolved';
    const isInProgress = status === 'in_progress';
    const isSubmitted = status === 'submitted';

    return [
      {
        label: 'Grievance Submitted',
        status: 'completed',
        detail: 'Logged securely via citizen portal',
      },
      {
        label: 'Triage & Verification',
        status: isSubmitted ? 'active' : 'completed',
        detail: 'Initial validation by redressal desk',
      },
      {
        label: 'Departmental Review',
        status: isInProgress ? 'active' : isResolved ? 'completed' : 'pending',
        detail: 'Field officer investigation and corrective action',
      },
      {
        label: 'Resolution & Closure',
        status: isResolved ? 'completed' : 'pending',
        detail: 'Final grievance redressal confirmation',
      },
    ];
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/citizen"
            id="track-back-to-dashboard"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-gov-900 transition group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            <span>{t('common.back')}</span>
          </Link>

          <span className="text-xs px-2.5 py-0.5 rounded bg-gov-100 text-gov-800 font-semibold border border-gov-200">
            {t('home.heroTitle')}
          </span>
        </div>

        {/* Search Box Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-gov space-y-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gov-800 text-xs font-semibold uppercase tracking-wider">
              <FileSearch className="w-4 h-4 text-gov-700" />
              <span>{t('citizen.trackStatus')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('citizen.trackPage.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('citizen.trackPage.subtitle')}
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="track-ticket-id-input"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder={t('citizen.trackPage.inputLabel')}
                className="block w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-gov-600 focus:border-gov-600"
              />
            </div>

            <button
              type="submit"
              id="track-ticket-submit-btn"
              disabled={loading}
              className="px-6 py-3 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>{t('citizen.trackPage.searching')}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-1.5" />
                  <span>{t('citizen.trackPage.searchBtn')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Grievance Result Card */}
        {grievance && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-gov overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Ticket Header */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gov-400">
                  {t('citizen.submitPage.ticketIdLabel')}
                </span>
                <div className="flex items-center space-x-2 font-mono text-lg sm:text-xl font-bold">
                  <span>{grievance.id}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">{t('common.status')}:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  grievance.status === 'resolved'
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : grievance.status === 'in_progress'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                }`}>
                  <span className="w-2 h-2 rounded-full mr-2 bg-current animate-pulse"></span>
                  {tStatus(grievance.status || 'submitted')}
                </span>
              </div>
            </div>

            {/* Ticket Meta Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/70 border-b border-slate-200 text-xs">
              <div className="p-4 sm:px-6">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">{t('common.department')}</span>
                <span className="font-bold text-slate-900 text-sm">{tDept(grievance.category || 'General')}</span>
              </div>
              <div className="p-4 sm:px-6">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">{t('common.location')}</span>
                <span className="font-medium text-slate-900 text-xs">{grievance.location || t('common.noData')}</span>
              </div>
              <div className="p-4 sm:px-6">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">{t('common.created')}</span>
                <span className="font-medium text-slate-900 text-xs">
                  {new Date(grievance.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Grievance Subject & Description */}
            <div className="p-6 sm:p-8 space-y-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {grievance.subject}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                  {grievance.description}
                </p>
              </div>

              {/* Attachments Section */}
              {grievance.attachments && grievance.attachments.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <span>{t('citizen.trackPage.evidenceTitle')} ({grievance.attachments.length})</span>
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
            </div>

            {/* Milestones Timeline */}
            <div className="p-6 sm:p-8 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('citizen.trackPage.timelineTitle')}
              </h3>

              <div className="space-y-6">
                {getMilestones(grievance.status).map((m, idx, arr) => {
                  const isCompleted = m.status === 'completed';
                  const isActive = m.status === 'active';
                  const isPending = m.status === 'pending';

                  return (
                    <div key={idx} className="relative flex items-start">
                      {idx < arr.length - 1 && (
                        <div
                          className={`absolute left-3.5 top-7 w-0.5 h-10 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      <div className="shrink-0 mr-4">
                        {isCompleted && (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {isActive && (
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center border-2 border-amber-500 ring-4 ring-amber-50">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isPending && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-300">
                            <Circle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold ${
                            isActive ? 'text-gov-900' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {m.label}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                              Current Stage
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{m.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Full image preview modal */}
      {selectedModalImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
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

      <Footer />
    </div>
  );
}
