import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileSpreadsheet, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  X,
  ExternalLink
} from 'lucide-react';

export default function CitizenSidebar({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onOpenProfile,
  onOpenNotifications,
  signOut,
  profile,
  user,
}) {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard',
      label: t('common.dashboard', 'Dashboard'),
      icon: LayoutDashboard,
      type: 'tab',
    },
    {
      id: 'submit',
      label: t('citizen.quickActions', 'Submit Grievance'),
      icon: PlusCircle,
      type: 'link',
      to: '/submit-grievance',
      badge: 'New',
    },
    {
      id: 'grievances',
      label: t('citizen.viewAllGrievances', 'My Grievances'),
      icon: FileSpreadsheet,
      type: 'tab',
    },
    {
      id: 'track',
      label: t('citizen.trackStatus', 'Track Grievance'),
      icon: Search,
      type: 'link',
      to: '/track',
    },
    {
      id: 'notifications',
      label: t('common.notifications', 'Notifications'),
      icon: Bell,
      type: 'action',
      onClick: onOpenNotifications,
    },
    {
      id: 'profile',
      label: t('common.profile', 'My Profile'),
      icon: User,
      type: 'action',
      onClick: onOpenProfile,
    },
    {
      id: 'settings',
      label: t('common.settings', 'Settings'),
      icon: Settings,
      type: 'tab',
    },
  ];

  const handleNavClick = (item) => {
    if (item.type === 'tab') {
      onSelectTab(item.id);
      onCloseMobile();
    } else if (item.type === 'action') {
      item.onClick();
      onCloseMobile();
    } else if (item.type === 'link') {
      onCloseMobile();
    }
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Citizen');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gov-950 flex items-center justify-center text-white shadow-sm border border-gov-800">
            <ShieldCheck className="w-5 h-5 text-gov-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gov-800">
              {t('navbar.govIndia', 'GOVERNMENT OF INDIA')}
            </span>
            <span className="text-sm font-bold text-slate-900 leading-tight">
              {t('common.portalName', 'Public Grievance Portal')}
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{t('citizen.dashboardTitle', 'Citizen Desk')}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
          {t('citizen.verifiedBadge', 'Verified')}
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto" aria-label="Sidebar Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.type === 'link') {
            return (
              <Link
                key={item.id}
                to={item.to}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onCloseMobile()}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-gov-900 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-gov-800 transition-colors" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gov-100 text-gov-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              id={`sidebar-nav-${item.id}`}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gov-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-gov-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-gov-300' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Public Home Quick Link */}
      <div className="px-3.5 py-2 border-t border-slate-100">
        <Link
          to="/"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <span>{t('common.home', 'Return to Portal Home')}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </Link>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gov-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {(displayName || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate">
                {displayName}
              </span>
              <span className="block text-[10px] text-slate-400 truncate font-mono">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          id="sidebar-logout-btn"
          className="w-full flex items-center justify-center px-3 py-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-200 rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>{t('common.signOut', 'Sign Out')}</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Body */}
          <div className="relative w-4/5 max-w-xs h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
