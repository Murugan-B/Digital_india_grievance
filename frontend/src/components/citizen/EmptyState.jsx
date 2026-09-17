import React from 'react';
import { FileText, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No grievances yet',
  description = 'Your submitted grievances will appear here once registered.',
  actionLabel = 'Submit Your First Grievance',
  onAction,
  icon: Icon = FileText,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-subtle flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-bold text-slate-900">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center px-4 py-2.5 bg-gov-900 hover:bg-gov-950 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-gov-800"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
