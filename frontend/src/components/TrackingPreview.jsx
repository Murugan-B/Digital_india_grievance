import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  FileSearch, 
  Sparkles,
  Info 
} from 'lucide-react';

export default function TrackingPreview() {
  const { t, tDept, tStatus, tPriority } = useLanguage();

  const timelineStages = [
    {
      label: t('status.submitted', 'Submitted'),
      status: 'completed',
      detail: t('home.step1Desc', 'Registered via web portal with photo evidence'),
      time: '10:30 AM',
    },
    {
      label: t('ai.semanticRouting', 'Smart Analysis'),
      status: 'completed',
      detail: t('home.step2Desc', 'Semantic category identified: Public Utilities'),
      time: '10:32 AM',
    },
    {
      label: t('home.step3Title', 'Department Assigned'),
      status: 'completed',
      detail: t('home.step3Desc', 'Dispatched to Municipal Water Supply Board'),
      time: '10:35 AM',
    },
    {
      label: t('status.in_progress', 'Under Review'),
      status: 'active',
      detail: t('official.details.statusNotesPlaceholder', 'Officer assigned for physical field verification'),
      time: 'In Progress',
    },
    {
      label: t('status.resolved', 'Resolved'),
      status: 'pending',
      detail: t('home.step4Desc', 'Awaiting resolution confirmation & citizen feedback'),
      time: 'Upcoming',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-gov-100 text-gov-800 text-xs font-semibold tracking-wider uppercase">
            <FileSearch className="w-3.5 h-3.5" />
            <span>{t('home.trackingPreviewTitle', 'Interactive System Preview')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('citizen.trackPage.title', 'Track Your Grievance')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            {t('citizen.trackPage.subtitle', 'Stay informed about every stage of your grievance with transparent timeline updates.')}
          </p>
        </div>

        {/* Realistic Ticket Preview Card */}
        <div className="mt-12 max-w-4xl mx-auto bg-white border border-slate-300/80 rounded-2xl shadow-gov overflow-hidden">
          
          {/* Card Top Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <span>{t('home.trackingPreviewTitle', 'Visual UI Preview')}</span>
                <span>•</span>
                <span>{t('ai.statusCompleted', 'Live Status Simulation')}</span>
              </div>
              <div className="flex items-baseline space-x-3">
                <span className="text-xs text-slate-400">{t('citizen.submitPage.ticketIdLabel', 'Grievance ID')}:</span>
                <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white">
                  GRV-2026-00124
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-medium">{t('common.status', 'Status')}:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
                {tStatus('in_progress')}
              </span>
            </div>
          </div>

          {/* Ticket Meta Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/70 border-b border-slate-200 text-sm">
            <div className="p-4 sm:px-6">
              <span className="block text-xs font-semibold text-slate-500 uppercase">{t('common.category', 'Category')}</span>
              <span className="font-semibold text-slate-900">{tDept('Water Supply')}</span>
            </div>
            <div className="p-4 sm:px-6">
              <span className="block text-xs font-semibold text-slate-500 uppercase">{t('common.department', 'Department')}</span>
              <span className="font-semibold text-slate-900">{tDept('Water Supply')}</span>
            </div>
            <div className="p-4 sm:px-6">
              <span className="block text-xs font-semibold text-slate-500 uppercase">{t('common.priority', 'Priority Rating')}</span>
              <span className="inline-flex items-center font-semibold text-emerald-700">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {tPriority('medium')} ({t('ai.modelVersion', 'SBERT v1.1')})
              </span>
            </div>
          </div>

          {/* Timeline Representation */}
          <div className="p-6 sm:p-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">
              {t('official.details.auditHistoryTitle', 'Milestone Progress & Audit Log')}
            </h3>

            <div className="space-y-6">
              {timelineStages.map((stage, idx) => {
                const isCompleted = stage.status === 'completed';
                const isActive = stage.status === 'active';
                const isPending = stage.status === 'pending';

                return (
                  <div key={idx} className="relative flex items-start group">
                    {/* Connecting line between stages */}
                    {idx < timelineStages.length - 1 && (
                      <div 
                        className={`absolute left-4 top-8 w-0.5 h-10 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Stage Icon */}
                    <div className="shrink-0 mr-4">
                      {isCompleted && (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {isActive && (
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center border-2 border-amber-500 ring-4 ring-amber-50">
                          <Clock className="w-4 h-4 animate-spin-slow" />
                        </div>
                      )}
                      {isPending && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-300">
                          <Circle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`text-base font-bold ${
                            isActive ? 'text-gov-900' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {stage.label}
                          </span>
                          {isActive && (
                            <span className="text-[11px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                              {t('status.in_progress', 'Current Phase')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-400 sm:text-right mt-0.5 sm:mt-0">
                          {stage.time}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        {stage.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanatory Footer Note */}
          <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex items-center justify-center space-x-2 text-xs text-slate-600 text-center">
            <Info className="w-4 h-4 text-gov-700 shrink-0" />
            <span>{t('footer.description', 'Stay informed about every stage of your grievance. Real-time updates delivered as officers act.')}</span>
          </div>

        </div>

      </div>
    </section>
  );
}
