import React from 'react';

export default function OfficialStatCard({ 
  title, 
  value, 
  icon: Icon, 
  colorTheme = 'slate', 
  helperText,
  onClick
}) {
  const themeStyles = {
    slate: {
      border: 'border-slate-200',
      bg: 'bg-white',
      iconBg: 'bg-slate-100 text-slate-700',
      valueColor: 'text-slate-900',
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-white',
      iconBg: 'bg-blue-50 text-blue-700',
      valueColor: 'text-blue-900',
    },
    amber: {
      border: 'border-amber-200',
      bg: 'bg-white',
      iconBg: 'bg-amber-50 text-amber-700',
      valueColor: 'text-amber-900',
    },
    emerald: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      iconBg: 'bg-emerald-50 text-emerald-700',
      valueColor: 'text-emerald-900',
    },
    purple: {
      border: 'border-purple-200',
      bg: 'bg-white',
      iconBg: 'bg-purple-50 text-purple-700',
      valueColor: 'text-purple-900',
    },
  };

  const theme = themeStyles[colorTheme] || themeStyles.slate;

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl border ${theme.border} ${theme.bg} shadow-subtle hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-gov-400' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className={`text-2xl sm:text-3xl font-extrabold ${theme.valueColor} tracking-tight`}>
          {value !== undefined ? value : 0}
        </span>
        {helperText && (
          <span className="text-[11px] font-medium text-slate-400">
            {helperText}
          </span>
        )}
      </div>
    </div>
  );
}
