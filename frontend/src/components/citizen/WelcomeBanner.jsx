import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { User, ShieldCheck, Globe, Calendar, Sparkles } from 'lucide-react';

export default function WelcomeBanner({ profile, user }) {
  const { t, language } = useLanguage();

  // Extract dynamic user name
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Citizen');

  const preferredLanguage =
    profile?.preferred_language ||
    user?.user_metadata?.preferred_language ||
    language ||
    'English';

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      
      {/* Left side: Greeting & details */}
      <div className="space-y-3 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>{t('citizen.verifiedBadge')}</span>
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gov-50 text-gov-800 text-xs font-semibold border border-gov-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-gov-700" />
            <span>{t('auth.roleCitizen')}</span>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('citizen.welcomeTitle')}, <span className="text-gov-900">{displayName}</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('citizen.welcomeSubtitle')}
          </p>
        </div>

        {/* Small metadata bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
          <div className="flex items-center space-x-1.5 font-mono">
            <span className="text-slate-400">{t('auth.email')}:</span>
            <span className="text-slate-700 font-semibold">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{t('citizen.submitPage.langLabel')}:</span>
            <span className="text-slate-700 uppercase font-semibold">{preferredLanguage}</span>
          </div>
        </div>
      </div>

      {/* Right side: Quick assurance card */}
      <div className="shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 z-10 min-w-[200px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Portal Status
        </span>
        <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Verified Citizen</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Supabase PostgreSQL Auth
        </p>
      </div>

    </div>
  );
}
