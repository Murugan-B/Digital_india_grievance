import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Plus, ShieldCheck, Clock, CheckCircle2, ArrowRight, Loader2, MapPin } from 'lucide-react';
import EmptyState from './EmptyState';

export default function RecentGrievances({ grievances = [], loading = false }) {
  const navigate = useNavigate();
  const { t, tDept, tStatus } = useLanguage();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            {tStatus('resolved')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            {tStatus('in_progress')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            {tStatus('rejected')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 mr-1 text-blue-600" />
            {tStatus('submitted')}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {t('citizen.recentGrievancesTitle')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('citizen.welcomeSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/submit-grievance')}
          id="recent-grievances-new-btn"
          className="inline-flex items-center px-3.5 py-1.5 bg-gov-900 hover:bg-gov-950 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>{t('citizen.submitNewGrievance')}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-gov-800 animate-spin" />
          <p className="text-xs text-slate-500">{t('common.loading')}</p>
        </div>
      ) : grievances.length === 0 ? (
        /* Empty State */
        <EmptyState
          title={t('citizen.noGrievancesYet')}
          description={t('citizen.noGrievancesSub')}
          actionLabel={t('citizen.fileFirstGrievance')}
          onAction={() => navigate('/submit-grievance')}
          icon={FileText}
        />
      ) : (
        /* Render Grievance Cards */
        <div className="space-y-3">
          {grievances.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-gov-400 hover:bg-white transition-all shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-gov-900 bg-gov-50 px-1.5 py-0.5 rounded border border-gov-200">
                    {item.id.slice(0, 8)}...
                  </span>
                  {getStatusBadge(item.status)}
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {item.subject}
                </h4>
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span>{t('common.department')}: <strong>{tDept(item.category || 'General')}</strong></span>
                  {item.location && (
                    <span className="flex items-center text-slate-400">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {item.location}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to={`/track`}
                className="inline-flex items-center px-3 py-1.5 bg-white hover:bg-gov-50 text-gov-800 hover:text-gov-950 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition group"
              >
                <span>{t('citizen.trackStatus')}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Queried via Node.js Express API from Supabase PostgreSQL</span>
        <div className="flex items-center space-x-1 text-emerald-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-time Active</span>
        </div>
      </div>
    </div>
  );
}
