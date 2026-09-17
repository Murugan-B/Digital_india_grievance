import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ShieldCheck, 
  Menu, 
  Globe, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import NotificationBell from '../NotificationBell';

export default function OfficialHeader({ 
  onToggleMobileSidebar, 
  onOpenProfile, 
  onSelectTab, 
  profile, 
  user, 
  signOut 
}) {
  const { language, setLanguage, languages, currentLanguage, t, tDept } = useLanguage();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const officialName = profile?.full_name || user?.email?.split('@')[0] || 'Official Officer';
  const department = profile?.department || 'Department Administration';
  const designation = profile?.designation || 'Nodal Officer';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Mobile Menu Toggle & Branding */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              id="official-mobile-menu-btn"
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/official" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-950 transition">
                <ShieldCheck className="w-5 h-5 text-gov-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-900">
                    Official Grievance Desk
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    OFFICIAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden md:block">
                  National Public Grievance Redressal Network
                </p>
              </div>
            </Link>

            {/* Active Department Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 pl-4 border-l border-slate-200 text-xs font-semibold text-slate-700">
              <Building2 className="w-4 h-4 text-gov-800" />
              <span className="px-2.5 py-1 bg-gov-50 border border-gov-200 rounded-md text-gov-900">
                {department}
              </span>
            </div>
          </div>

          {/* Right: Language, Notifications, Official Profile Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                id="official-lang-selector"
                className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                aria-label={t('common.selectLanguage')}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentLanguage?.nativeName || 'English'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-gov-50 hover:text-gov-900 flex items-center justify-between"
                    >
                      <span className="font-medium">{lang.nativeName} ({lang.name})</span>
                      {language === lang.code && <CheckCircle2 className="w-3.5 h-3.5 text-gov-700 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Department Notifications */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                id="official-profile-dropdown-btn"
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-gov-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {officialName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {officialName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                    {designation}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{officialName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                      {tDept(department)}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('common.profile')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onSelectTab('settings');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('common.settings')}</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        signOut();
                      }}
                      id="official-header-logout-btn"
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('common.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
