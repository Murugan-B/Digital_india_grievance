import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Shield, LogOut, Menu, X, RefreshCw, UserCheck, Sparkles, Globe, ChevronDown, CheckCircle2 } from 'lucide-react';
import NotificationBell from '../NotificationBell';

export default function AdminHeader({ adminProfile, onRefresh, refreshing, onToggleMobileSidebar, mobileSidebarOpen }) {
  const { language, setLanguage, languages, currentLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 border-b border-slate-800 shadow-md">
      {/* Government Tricolor Top Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Portal Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-gov-800 border border-gov-700 flex items-center justify-center text-white shadow-sm group-hover:bg-gov-700 transition">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  CPGRAMS — Digital India
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 uppercase">
                  {t('admin.badge')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {t('navbar.portalTag')}
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              id="admin-lang-selector"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
              aria-label={t('common.selectLanguage')}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{currentLanguage?.nativeName || 'English'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-800 hover:bg-gov-50 hover:text-gov-900 flex items-center justify-between font-medium"
                  >
                    <span>{lang.nativeName} ({lang.name})</span>
                    {language === lang.code && <CheckCircle2 className="w-3.5 h-3.5 text-gov-700 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title={t('common.refresh')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{t('common.refresh')}</span>
            </button>
          )}

          {/* Admin Notification Bell */}
          <NotificationBell theme="dark" />

          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-white leading-tight">
              {adminProfile?.full_name || 'Administrator'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center justify-end space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('admin.badge')}</span>
            </span>
          </div>

          <Link
            to="/citizen"
            title="Switch to Citizen View"
            className="hidden lg:inline-flex items-center px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            <span>{t('footer.citizenPortal')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
