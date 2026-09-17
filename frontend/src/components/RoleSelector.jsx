import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { User, Shield, Lock } from 'lucide-react';

export default function RoleSelector({ selectedRole, onSelectRole, className = '' }) {
  const { t } = useLanguage();

  const roles = [
    {
      id: 'citizen',
      label: t('auth.roleCitizen', 'Citizen'),
      description: t('home.step1Desc', 'Submit & track public grievances'),
      icon: User,
      badge: null,
    },
    {
      id: 'official',
      label: t('auth.roleOfficial', 'Department Official'),
      description: t('official.dashboardTitle', 'Departmental triage & resolution'),
      icon: Shield,
      badge: t('status.in_progress', 'Verification Req.'),
    },
    {
      id: 'admin',
      label: t('auth.roleAdmin', 'System Administrator'),
      description: t('admin.dashboardTitle', 'System control & user audit'),
      icon: Lock,
      badge: t('status.rejected', 'Restricted'),
    },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {t('auth.roleSelection', 'Select User Role')}
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          {t('auth.roleSelection', 'Account Type')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <button
              key={role.id}
              type="button"
              id={`role-btn-${role.id}`}
              onClick={() => onSelectRole(role.id)}
              aria-pressed={isSelected}
              className={`flex flex-col items-start sm:items-center text-left sm:text-center p-2.5 sm:py-3 rounded-lg transition-all relative ${
                isSelected
                  ? 'bg-white text-gov-950 font-bold shadow-sm border border-slate-200/80 ring-1 ring-gov-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center sm:flex-col sm:items-center space-x-2 sm:space-x-0 sm:space-y-1 w-full">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-gov-900 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 sm:w-full">
                  <div className="flex items-center sm:justify-center space-x-1">
                    <span className="text-xs sm:text-[13px] font-bold leading-tight">
                      {role.label}
                    </span>
                  </div>
                  <span className="block text-[10px] font-normal text-slate-500 sm:truncate mt-0.5">
                    {role.description}
                  </span>
                </div>
              </div>

              {role.badge && (
                <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded mt-1.5 self-start sm:self-center ${
                  isSelected ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {role.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
