import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  X,
  Building2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function OfficialSidebar({
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
  const { t, tDept } = useLanguage();
  const department = profile?.department || 'Department Administration';
  const designation = profile?.designation || 'Nodal Redressal Officer';

  const navItems = [
    { id: 'dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { id: 'grievances', label: t('official.dashboardTitle'), icon: FileText },
    { id: 'pending_routing', label: t('admin.stats.unassigned'), icon: Layers },
    { id: 'in_progress', label: t('official.stats.inProgress'), icon: Clock },
    { id: 'resolved', label: t('official.stats.resolved'), icon: CheckCircle2 },
    { id: 'notifications', label: t('common.notifications'), icon: Bell, action: onOpenNotifications },
    { id: 'profile', label: t('common.profile'), icon: User, action: onOpenProfile },
    { id: 'settings', label: t('common.settings'), icon: Settings },
  ];

  const handleNavClick = (item) => {
    if (item.action) {
      item.action();
    } else {
      onSelectTab(item.id);
    }
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 space-y-6">
      
      {/* Top Section */}
      <div className="space-y-6">
        
        {/* Officer Card */}
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gov-700 text-white flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gov-300 block">
                Department Desk
              </span>
              <p className="text-xs font-bold text-white truncate">
                {department}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="truncate">{profile?.full_name || 'Officer'}</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
              Active
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !item.action;

            return (
              <button
                key={item.id}
                type="button"
                id={`official-sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gov-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gov-300' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Bottom Section: Sign Out */}
      <div className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={signOut}
          id="official-sidebar-signout-btn"
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Navigation
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
