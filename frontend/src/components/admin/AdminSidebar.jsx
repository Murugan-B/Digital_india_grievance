import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  UserCheck,
  FileText,
  BrainCircuit,
  Building2,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminSidebar({ activeTab, onSelectTab, pendingOfficialsCount = 0, flaggedAICount = 0, unassignedCount = 0, onCloseMobile }) {
  const { signOut, user, profile } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'overview',
      label: t('admin.nav.overview'),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'analytics',
      label: t('admin.nav.analytics'),
      icon: BarChart3,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
    },
    {
      id: 'verification',
      label: t('admin.nav.verification'),
      icon: UserCheck,
      badge: pendingOfficialsCount > 0 ? pendingOfficialsCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-extrabold',
    },
    {
      id: 'grievances',
      label: t('admin.nav.grievances'),
      icon: FileText,
      badge: unassignedCount > 0 ? `${unassignedCount}` : null,
      badgeColor: 'bg-blue-100 text-blue-800 font-semibold',
    },
    {
      id: 'ai_review',
      label: t('admin.nav.aiRouting'),
      icon: BrainCircuit,
      badge: flaggedAICount > 0 ? flaggedAICount : null,
      badgeColor: 'bg-purple-100 text-purple-800 font-bold',
    },
    {
      id: 'departments',
      label: t('admin.nav.departments'),
      icon: Building2,
      badge: null,
    },
    {
      id: 'users',
      label: t('admin.nav.users'),
      icon: Users,
      badge: null,
    },
    {
      id: 'profile',
      label: t('admin.nav.security'),
      icon: ShieldCheck,
      badge: null,
    },
  ];

  const handleNavClick = (id) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-subtle min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-4 space-y-1">
        <p className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Oversight & Controls
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gov-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] tracking-tight ${
                      item.badgeColor || (isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-700 font-bold')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Identity Footer & Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gov-800 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center space-x-2 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
}
