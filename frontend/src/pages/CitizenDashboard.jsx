import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { 
  FileText, 
  Send, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Globe, 
  Bell, 
  ShieldCheck,
  Plus,
  MapPin,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

import CitizenHeader from '../components/citizen/CitizenHeader';
import CitizenSidebar from '../components/citizen/CitizenSidebar';
import WelcomeBanner from '../components/citizen/WelcomeBanner';
import StatCard from '../components/citizen/StatCard';
import QuickActions from '../components/citizen/QuickActions';
import RecentGrievances from '../components/citizen/RecentGrievances';
import HelpCard from '../components/citizen/HelpCard';
import ProfileModal from '../components/citizen/ProfileModal';
import NotificationPanel from '../components/citizen/NotificationPanel';
import EmptyState from '../components/citizen/EmptyState';

export default function CitizenDashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { t, tDept, tStatus, tPriority } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [grievances, setGrievances] = useState([]);
  const [grievancesLoading, setGrievancesLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch citizen grievances from Express backend
  const loadGrievances = useCallback(async () => {
    if (!user) return;
    setGrievancesLoading(true);
    setFetchError(null);
    try {
      const data = await api.getMyGrievances();
      setGrievances(data);
    } catch (err) {
      console.error('[CitizenDashboard fetch error]:', err);
      setFetchError(err.message || 'Unable to load your grievances.');
    } finally {
      setGrievancesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGrievances();
    }
  }, [user, loadGrievances]);

  // Loading skeleton state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-gov-900 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading Citizen Dashboard...</p>
        </div>
      </div>
    );
  }

  // Graceful fallback if user is missing
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-gov text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Session Required</h2>
          <p className="text-xs text-slate-600">
            Please log in with your citizen credentials to access the dashboard.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 bg-gov-900 text-white text-xs font-semibold rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Calculate dynamic stats from real backend data
  const totalCount = grievances.length;
  const submittedCount = grievances.filter((g) => g.status === 'submitted').length;
  const inProgressCount = grievances.filter((g) => g.status === 'in_progress').length;
  const resolvedCount = grievances.filter((g) => g.status === 'resolved').length;

  const stats = [
    {
      id: 'total',
      title: t('citizen.stats.total'),
      value: totalCount,
      icon: FileText,
      colorTheme: 'slate',
      helperText: t('common.all'),
    },
    {
      id: 'submitted',
      title: t('citizen.stats.submitted'),
      value: submittedCount,
      icon: Send,
      colorTheme: 'blue',
      helperText: t('status.submitted'),
    },
    {
      id: 'in_progress',
      title: t('citizen.stats.inProgress'),
      value: inProgressCount,
      icon: Clock,
      colorTheme: 'amber',
      helperText: t('status.in_progress'),
    },
    {
      id: 'resolved',
      title: t('citizen.stats.resolved'),
      value: resolvedCount,
      icon: CheckCircle2,
      colorTheme: 'emerald',
      helperText: t('status.resolved'),
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      
      {/* Sticky Sidebar (Desktop) / Drawer (Mobile) */}
      <CitizenSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        signOut={signOut}
        profile={profile}
        user={user}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <CitizenHeader
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onSelectTab={setActiveTab}
          profile={profile}
          user={user}
          signOut={signOut}
        />

        {/* Dashboard Main Scrollable Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Global API Error Alert & Retry */}
          {fetchError && (
            <div className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900 animate-in fade-in">
              <div className="flex items-start sm:items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">{t('common.error')}</h4>
                  <p className="text-xs text-red-700 mt-0.5">{fetchError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadGrievances}
                disabled={grievancesLoading}
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${grievancesLoading ? 'animate-spin' : ''}`} />
                <span>{t('common.retry')}</span>
              </button>
            </div>
          )}

          {/* TAB 1: Main Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <>
              {/* 1. Welcome Greeting Section */}
              <WelcomeBanner profile={profile} user={user} />

              {/* 2. Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {stats.map((stat) => (
                  <StatCard
                    key={stat.id}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    colorTheme={stat.colorTheme}
                    helperText={stat.helperText}
                  />
                ))}
              </div>

              {/* 3. Quick Actions Grid */}
              <QuickActions
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                onSelectTab={setActiveTab}
              />

              {/* 4. Recent Grievances & Information Split Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <RecentGrievances
                    grievances={grievances}
                    loading={grievancesLoading}
                  />
                </div>

                <div className="lg:col-span-4">
                  <HelpCard />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: My Grievances View */}
          {activeTab === 'grievances' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {t('citizen.viewAllGrievances')} ({grievances.length})
                  </h1>
                  <p className="text-xs text-slate-500">
                    {t('citizen.recentGrievancesTitle')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/submit-grievance')}
                  className="inline-flex items-center px-4 py-2 bg-gov-900 hover:bg-gov-950 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>{t('citizen.submitNewGrievance')}</span>
                </button>
              </div>

              {grievancesLoading ? (
                <div className="py-16 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-8 h-8 text-gov-800 animate-spin" />
                  <p className="text-xs text-slate-500">{t('common.loading')}</p>
                </div>
              ) : fetchError ? (
                <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3 p-6">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">{t('common.error')}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">{fetchError}</p>
                  <button
                    type="button"
                    onClick={loadGrievances}
                    className="inline-flex items-center px-4 py-2 bg-gov-900 hover:bg-gov-950 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    <span>{t('common.retry')}</span>
                  </button>
                </div>
              ) : grievances.length === 0 ? (
                <EmptyState
                  title={t('citizen.noGrievancesYet')}
                  description={t('citizen.noGrievancesSub')}
                  actionLabel={t('citizen.fileFirstGrievance')}
                  onAction={() => navigate('/submit-grievance')}
                />
              ) : (
                <div className="space-y-4">
                  {grievances.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:border-gov-400 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-gov-900 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                            {item.id}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tStatus(item.status || 'submitted')}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {t('common.priority')}: {tPriority(item.priority || 'medium')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {item.subject}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500">
                        <div className="flex items-center space-x-4">
                          <span>{t('common.department')}: <strong className="text-slate-700">{tDept(item.category || 'General')}</strong></span>
                          {item.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {item.location}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/track`}
                          className="inline-flex items-center font-bold text-gov-800 hover:text-gov-950 transition"
                        >
                          <span>{t('citizen.trackStatus')}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Settings View */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
                <h1 className="text-xl font-bold text-slate-900">
                  {t('common.settings')}
                </h1>
                <p className="text-xs text-slate-500">
                  {t('citizen.welcomeSubtitle')}
                </p>
              </div>

              {/* Preferences Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  {t('common.settings')}
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">{t('citizen.submitPage.langLabel')}</span>
                      <span className="text-slate-500 text-[11px]">{t('common.selectLanguage')}</span>
                    </div>
                    <span className="font-bold text-gov-800 uppercase px-2.5 py-1 bg-white rounded-md border border-slate-200">
                      {profile?.preferred_language || 'English'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">{t('common.notifications')}</span>
                      <span className="text-slate-500 text-[11px]">{t('notifications.title')}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                      {t('common.success')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">{t('admin.nav.security')}</span>
                      <span className="text-slate-500 text-[11px]">{t('auth.adminRoleNotice')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs font-semibold text-gov-800 hover:text-gov-950 underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        user={user}
      />

    </div>
  );
}
