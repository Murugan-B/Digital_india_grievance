import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Menu, 
  Globe, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import NotificationBell from '../NotificationBell';

export default function CitizenHeader({
  onToggleMobileSidebar,
  onOpenProfile,
  onSelectTab,
  profile,
  user,
  signOut,
}) {
  const { t, language, setLanguage, currentLanguage, languages } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const langRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Citizen');

  const initials = (displayName || 'C')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile hamburger & branding */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            id="mobile-sidebar-toggle"
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation drawer"
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gov-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gov-950 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-4 h-4 text-gov-300" />
            </div>
            <span className="text-sm font-bold text-slate-900 hidden sm:inline">
              {t('common.portalName', 'Public Grievance Portal')}
            </span>
          </Link>

          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-gov-100 text-gov-800 text-[11px] font-bold border border-gov-200">
            {t('citizen.dashboardTitle', 'Citizen Dashboard')}
          </span>
        </div>

        {/* Right: Language, Notifications, User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              id="citizen-language-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-gov-600 transition"
              aria-label={t('common.selectLanguage', 'Change language')}
              aria-expanded={langDropdownOpen}
            >
              <Globe className="w-3.5 h-3.5 text-gov-700" />
              <span className="hidden sm:inline">{currentLanguage.native}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  {t('common.selectLanguage', 'Select Language')}
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-gov-50 transition-colors ${
                      language === lang.code ? 'text-gov-800 font-bold bg-gov-50' : 'text-slate-700'
                    }`}
                  >
                    <span>{lang.native}</span>
                    {language === lang.code && <Check className="w-3 h-3 text-gov-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              id="citizen-user-menu-btn"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 p-1.5 pl-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition focus:ring-2 focus:ring-gov-600"
              aria-expanded={userDropdownOpen}
              aria-label="User menu"
            >
              <div className="w-7 h-7 rounded-lg bg-gov-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials || 'C'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 max-w-[120px] truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-none">
                  {t('auth.roleCitizen', 'Citizen')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-gov border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* User Info header inside menu */}
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {displayName}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-mono truncate">
                    {user?.email}
                  </span>
                  <span className="inline-block mt-1 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {t('auth.roleCitizen', 'Citizen')}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenProfile();
                    }}
                    id="user-menu-profile-btn"
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-gov-900 transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('common.profile', 'My Profile')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSelectTab('settings');
                    }}
                    id="user-menu-settings-btn"
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-gov-900 transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('common.settings', 'Settings')}</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOut();
                    }}
                    id="user-menu-logout-btn"
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('common.signOut', 'Sign Out')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
