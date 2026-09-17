import React, { useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Inbox, X } from 'lucide-react';

export default function NotificationPanel({ isOpen, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-gov border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-gov-800" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Notifications
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification panel"
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Empty State */}
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">
          <Inbox className="w-6 h-6 text-slate-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800">No new notifications</p>
          <p className="text-xs text-slate-500 max-w-xs">
            Status updates and official responses to your submitted grievances will appear here.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
        <span className="text-[11px] text-slate-400 font-medium">
          Real-time notification engine will be integrated in Phase 11
        </span>
      </div>
    </div>
  );
}
