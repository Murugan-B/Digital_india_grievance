import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  UserCheck, 
  Clock, 
  Inbox,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { notificationApi } from '../lib/notificationApi';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationBadge(type) {
  switch (type) {
    case 'ai_routed':
      return {
        icon: Sparkles,
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'ai_review_required':
      return {
        icon: AlertCircle,
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'grievance_resolved':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'grievance_rejected':
      return {
        icon: XCircle,
        bg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
      };
    case 'manual_assignment':
      return {
        icon: UserCheck,
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'status_changed':
      return {
        icon: Clock,
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'grievance_submitted':
    default:
      return {
        icon: FileText,
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-gov-700',
      };
  }
}

export default function NotificationBell({ theme = 'light', onGrievanceClick = null }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const containerRef = useRef(null);

  // Poll for unread count
  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const count = await notificationApi.getUnreadCount();
        if (mounted) setUnreadCount(count);
      } catch (err) {
        // Silently ignore background counter errors to not disturb UI
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30s poll

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch notifications when opened
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    async function loadNotifications() {
      setLoading(true);
      setError(null);
      try {
        const { notifications: list } = await notificationApi.getMyNotifications({ page: 1, limit: 20 });
        if (mounted) {
          setNotifications(list);
          const count = list.filter((n) => !n.is_read).length;
          setUnreadCount(count);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load notifications');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationBell] Mark read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationBell] Mark all read error:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className={`p-2 rounded-lg transition relative focus:outline-none focus:ring-2 ${
          isDark
            ? 'text-slate-300 hover:text-white hover:bg-slate-800 focus:ring-amber-400'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-gov-600'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-gov-800" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {t('notifications.title')}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-gov-100 text-gov-900 rounded-full">
                  {unreadCount} {t('notifications.unread')}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-[11px] font-medium text-gov-700 hover:text-gov-900 flex items-center space-x-1 hover:underline disabled:opacity-50 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('notifications.markAllRead')}</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-gov-700 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">{t('common.loading')}</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-slate-600 underline"
                >
                  {t('common.close')}
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">{t('notifications.empty')}</p>
                  <p className="text-[11px] text-slate-500 max-w-[220px]">
                    {t('footer.description')}
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const badge = getNotificationBadge(notif.type);
                const IconComponent = badge.icon;
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 px-4 transition flex items-start space-x-3 cursor-pointer ${
                      notif.is_read
                        ? 'bg-white hover:bg-slate-50/70 text-slate-600'
                        : 'bg-gov-50/40 hover:bg-gov-50/70 text-slate-900 font-medium'
                    }`}
                    onClick={() => {
                      if (!notif.is_read) handleMarkAsRead(notif.id);
                      if (onGrievanceClick && notif.grievance_id) {
                        onGrievanceClick(notif.grievance_id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {/* Category Icon */}
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border ${badge.bg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs truncate ${notif.is_read ? 'text-slate-800 font-semibold' : 'text-slate-900 font-bold'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug break-words line-clamp-2">
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread indicator / Mark Read Button */}
                    {!notif.is_read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        title="Mark as read"
                        aria-label="Mark notification as read"
                        className="p-1 text-gov-700 hover:text-gov-900 hover:bg-gov-100/60 rounded transition flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Live Redressal Activity</span>
            <span className="text-[10px] font-mono text-slate-400">Digital India</span>
          </div>
        </div>
      )}
    </div>
  );
}
