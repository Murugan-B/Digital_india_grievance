import React from 'react';

export default function AdminStatCard({ title, value, subtitle, icon: Icon, color = 'blue', onClick, active = false }) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50/70 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700',
      activeRing: 'ring-2 ring-blue-600 bg-blue-50/40',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-800',
      activeRing: 'ring-2 ring-amber-600 bg-amber-50/40',
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-800',
      activeRing: 'ring-2 ring-emerald-600 bg-emerald-50/40',
    },
    indigo: {
      bg: 'bg-indigo-50/70 text-indigo-800 border-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-800',
      activeRing: 'ring-2 ring-indigo-600 bg-indigo-50/40',
    },
    purple: {
      bg: 'bg-purple-50/70 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-800',
      activeRing: 'ring-2 ring-purple-600 bg-purple-50/40',
    },
    rose: {
      bg: 'bg-rose-50/70 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-800',
      activeRing: 'ring-2 ring-rose-600 bg-rose-50/40',
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`h-full min-h-[116px] flex flex-col justify-between bg-white rounded-xl p-4 sm:p-4.5 border border-slate-200 shadow-subtle transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      } ${active ? style.activeRing : ''}`}
    >
      {/* Top Row: Metric Value on Left + 44x44 Icon on Right */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono leading-none">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
        {Icon && (
          <div
            className={`w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}
            style={{ width: '44px', height: '44px' }}
          >
            <Icon className="w-[22px] h-[22px] shrink-0" style={{ width: '22px', height: '22px' }} />
          </div>
        )}
      </div>

      {/* Bottom Row: Full Width Label spanning entire card width (no icon collision) */}
      <div className="mt-2.5 pt-1 border-t border-slate-100">
        <p className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider leading-snug break-words">
          {title}
        </p>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}


