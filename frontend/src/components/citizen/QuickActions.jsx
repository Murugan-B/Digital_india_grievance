import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { PlusCircle, Search, FileSpreadsheet, Bell, ArrowRight } from 'lucide-react';

export default function QuickActions({ onOpenNotifications, onSelectTab }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          {t('citizen.quickActions')}
        </h3>
        <span className="text-xs text-slate-400 font-medium">{t('common.actions')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Action 1: Submit Grievance (Primary CTA) */}
        <Link
          to="/submit-grievance"
          id="quick-action-submit-grievance"
          className="flex items-start p-4 rounded-xl bg-gov-900 hover:bg-gov-950 text-white shadow-sm hover:shadow transition-all group border border-gov-800"
        >
          <div className="w-9 h-9 rounded-lg bg-gov-800 text-gov-300 flex items-center justify-center mr-3 shrink-0 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-white">
              {t('citizen.submitNewGrievance')}
            </span>
            <span className="block text-[11px] text-slate-300 mt-0.5">
              {t('citizen.fileFirstGrievance')}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gov-300 self-center ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Action 2: Track a Grievance */}
        <Link
          to="/track"
          id="quick-action-track-grievance"
          className="flex items-start p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 hover:border-slate-300 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mr-3 shrink-0 group-hover:scale-105 transition-transform">
            <Search className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-900">
              {t('citizen.trackStatus')}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              {t('home.trackButton')}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 self-center ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Action 3: View My Grievances */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('grievances')}
          id="quick-action-my-grievances"
          className="flex items-start p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 hover:border-slate-300 transition-all group text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mr-3 shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-900">
              {t('citizen.viewAllGrievances')}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              {t('citizen.recentGrievancesTitle')}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 self-center ml-1 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Action 4: View Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          id="quick-action-notifications"
          className="flex items-start p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 hover:border-slate-300 transition-all group text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mr-3 shrink-0 group-hover:scale-105 transition-transform">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-900">
              {t('common.notifications')}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              {t('notifications.title')}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 self-center ml-1 group-hover:translate-x-0.5 transition-transform" />
        </button>

      </div>
    </div>
  );
}
