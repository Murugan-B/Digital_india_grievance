import React from 'react';

export default function StatCard({ title, value, icon: Icon, colorTheme = 'blue', helperText }) {
  const themes = {
    slate: {
      bg: 'bg-slate-50 border-slate-200 hover:border-slate-400',
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      valueText: 'text-slate-900',
    },
    blue: {
      bg: 'bg-blue-50/60 border-blue-200 hover:border-blue-400',
      iconBg: 'bg-blue-100 text-blue-800 border-blue-200',
      valueText: 'text-blue-950',
    },
    amber: {
      bg: 'bg-amber-50/60 border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-800 border-amber-200',
      valueText: 'text-amber-950',
    },
    emerald: {
      bg: 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      valueText: 'text-emerald-950',
    },
  };

  const theme = themes[colorTheme] || themes.blue;

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 shadow-subtle hover:shadow-gov flex items-center justify-between bg-white ${theme.bg}`}
    >
      <div className="space-y-1">
        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-baseline space-x-2">
          <span className={`text-3xl font-extrabold tracking-tight font-mono ${theme.valueText}`}>
            {value}
          </span>
          {helperText && (
            <span className="text-[11px] text-slate-500 font-medium">
              {helperText}
            </span>
          )}
        </div>
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${theme.iconBg}`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
