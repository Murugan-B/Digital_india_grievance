import React from 'react';
import {
  Users,
  UserCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BrainCircuit,
  Building2,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import AdminStatCard from './AdminStatCard';

export default function AdminOverview({ stats, onNavigate }) {
  const { t } = useLanguage();
  if (!stats) return null;

  const { users = {}, grievances = {}, ai = {}, departments = {} } = stats;

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-gov-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-gov relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-gov-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{t('admin.badge')}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('admin.dashboardTitle')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('footer.description')}
          </p>
        </div>
      </div>

      {/* 2. Action Required Alert Banners */}
      {(users.pendingOfficials > 0 || ai.flaggedForReview > 0 || grievances.unassigned > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {users.pendingOfficials > 0 && (
            <div
              onClick={() => onNavigate('verification')}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/80 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {users.pendingOfficials} Official{users.pendingOfficials > 1 ? 's' : ''} Awaiting Review
                  </p>
                  <p className="text-[11px] text-amber-700">Pending departmental verification</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition" />
            </div>
          )}

          {ai.flaggedForReview > 0 && (
            <div
              onClick={() => onNavigate('ai_review')}
              className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-purple-100/80 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-900">
                    {ai.flaggedForReview} AI Flagged Ticket{ai.flaggedForReview > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-purple-700">Semantic confidence below 0.65</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition" />
            </div>
          )}

          {grievances.unassigned > 0 && (
            <div
              onClick={() => onNavigate('grievances')}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-blue-100/80 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900">
                    {grievances.unassigned} Unassigned Grievance{grievances.unassigned > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-blue-700">Pending department assignment</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-700 group-hover:translate-x-1 transition" />
            </div>
          )}
        </div>
      )}

      {/* 3. Grievance Redressal Metrics */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          {t('citizen.recentGrievancesTitle')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 items-stretch">
          <AdminStatCard
            title={t('admin.stats.totalSubmitted')}
            value={grievances.total || 0}
            icon={FileText}
            color="blue"
            onClick={() => onNavigate('grievances')}
          />
          <AdminStatCard
            title={t('admin.stats.submitted')}
            value={grievances.submitted || 0}
            icon={Clock}
            color="indigo"
            onClick={() => onNavigate('grievances')}
          />
          <AdminStatCard
            title={t('admin.stats.inProgress')}
            value={grievances.in_progress || 0}
            icon={Clock}
            color="amber"
            onClick={() => onNavigate('grievances')}
          />
          <AdminStatCard
            title={t('admin.stats.resolved')}
            value={grievances.resolved || 0}
            icon={CheckCircle2}
            color="emerald"
            onClick={() => onNavigate('grievances')}
          />
          <AdminStatCard
            title={t('admin.stats.rejected')}
            value={grievances.rejected || 0}
            icon={XCircle}
            color="rose"
            onClick={() => onNavigate('grievances')}
          />
          <AdminStatCard
            title={t('admin.stats.unassigned')}
            value={grievances.unassigned || 0}
            icon={HelpCircle}
            color="purple"
            onClick={() => onNavigate('grievances')}
          />
        </div>
      </div>

      {/* 4. User Directory & AI Telemetry Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Ecosystem */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-gov-800" />
              <span>{t('admin.nav.users')}</span>
            </h3>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs font-semibold text-gov-800 hover:text-gov-950 flex items-center space-x-1"
            >
              <span>{t('common.actions')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-500 uppercase">{t('auth.roleCitizen')}</span>
              <span className="text-xl font-extrabold text-slate-900">{users.totalCitizens || 0}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-500 uppercase">{t('auth.roleOfficial')}</span>
              <span className="text-xl font-extrabold text-slate-900">{users.totalOfficials || 0}</span>
            </div>
            <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-100">
              <span className="block text-[11px] font-semibold text-amber-800 uppercase">{t('admin.stats.pendingOfficials')}</span>
              <span className="text-xl font-extrabold text-amber-900">{users.pendingOfficials || 0}</span>
            </div>
          </div>
        </div>

        {/* AI Semantic Engine & Departments */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <BrainCircuit className="w-4 h-4 text-purple-700" />
              <span>{t('ai.semanticRouting')}</span>
            </h3>
            <button
              onClick={() => onNavigate('ai_review')}
              className="text-xs font-semibold text-purple-800 hover:text-purple-950 flex items-center space-x-1"
            >
              <span>{t('ai.routingAudit')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-purple-50/70 rounded-lg border border-purple-100">
              <span className="block text-[11px] font-semibold text-purple-800 uppercase">{t('ai.routingScore')}</span>
              <span className="text-xl font-extrabold text-purple-950">{ai.totalRoutings || 0}</span>
            </div>
            <div className="p-3.5 bg-purple-50/70 rounded-lg border border-purple-100">
              <span className="block text-[11px] font-semibold text-purple-800 uppercase">{t('ai.statusFlagged')}</span>
              <span className="text-xl font-extrabold text-purple-950">{ai.flaggedForReview || 0}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-500 uppercase">{t('admin.stats.activeDepts')}</span>
              <span className="text-xl font-extrabold text-slate-900">{departments.activeCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
