import React from 'react';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react';

export function AdminEmptyState({ title = 'No records found', message = 'No data matching your active filters or search criteria.', actionText, onAction }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-subtle">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center px-4 py-2 bg-gov-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export function AdminLoadingSkeleton({ count = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-200" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between space-x-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="h-6 bg-slate-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminErrorState({ message = 'An error occurred while loading data.', onRetry }) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 text-center space-y-3 shadow-subtle">
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">System Notice</h3>
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}
