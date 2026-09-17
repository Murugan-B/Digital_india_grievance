import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { 
  Building2, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Layers, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  User, 
  Settings, 
  Sparkles,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import OfficialHeader from '../components/official/OfficialHeader';
import OfficialSidebar from '../components/official/OfficialSidebar';
import OfficialStatCard from '../components/official/OfficialStatCard';
import OfficialGrievanceList from '../components/official/OfficialGrievanceList';
import OfficialGrievanceDetails from '../components/official/OfficialGrievanceDetails';
import ProfileModal from '../components/citizen/ProfileModal';

export default function OfficialDashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { t, tDept, tStatus, tPriority } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Department data states
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    pendingRouting: 0,
  });

  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected grievance detail modal state
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const departmentName = profile?.department || 'Government Department';

  // Load department grievances and stats from Express backend
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setErrorMsg(null);

    try {
      const [grievanceData, statsData] = await Promise.all([
        api.getOfficialGrievances(),
        api.getOfficialStats(),
      ]);

      setGrievances(grievanceData || []);
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('[OfficialDashboard error]:', err);
      setErrorMsg(err.message || 'Unable to load department grievances. Please try again.');
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Handle reviewing a specific grievance
  const handleSelectGrievance = async (item) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getOfficialGrievanceById(item.id);
      setSelectedGrievance(detail || item);
    } catch (err) {
      console.error('[Failed to fetch grievance detail]:', err);
      setSelectedGrievance(item);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle status update submission
  const handleUpdateStatus = async (grievanceId, newStatus, notes) => {
    setUpdatingStatus(true);
    try {
      const updated = await api.updateOfficialGrievanceStatus(grievanceId, newStatus, notes);
      
      // Update local item state
      setSelectedGrievance((prev) => (prev ? { ...prev, status: newStatus } : null));

      // Refresh data
      await loadDashboardData();
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-gov-800 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Verifying official credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      
      {/* Official Sticky/Drawer Sidebar */}
      <OfficialSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setActiveTab('notifications')}
        signOut={signOut}
        profile={profile}
        user={user}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <OfficialHeader
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onSelectTab={setActiveTab}
          profile={profile}
          user={user}
          signOut={signOut}
        />

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Error Alert Banner with Retry */}
          {errorMsg && (
            <div className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900 animate-in fade-in">
              <div className="flex items-start sm:items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">Failed to load department records</h4>
                  <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadDashboardData}
                disabled={loadingData}
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* TAB 1: Main Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <>
              {/* Department Welcome Greeting */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gov-800 uppercase tracking-wider">
                    <Building2 className="w-4 h-4" />
                    <span>Official Departmental Desk</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome, {profile?.full_name || 'Nodal Officer'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                    You are signed in as the authorized redressal officer for <strong>{departmentName}</strong>. Review incoming citizen submissions and manage ticket milestones.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={loadDashboardData}
                    disabled={loadingData}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingData ? 'animate-spin' : ''}`} />
                    <span>Refresh Desk</span>
                  </button>
                </div>
              </div>

              {/* Four Department Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <OfficialStatCard
                  title={t('official.stats.totalAssigned')}
                  value={stats.totalAssigned}
                  icon={FileText}
                  colorTheme="blue"
                  helperText={`${tDept(departmentName)}`}
                  onClick={() => setActiveTab('grievances')}
                />
                <OfficialStatCard
                  title={t('admin.stats.unassigned')}
                  value={stats.pendingRouting}
                  icon={Layers}
                  colorTheme="slate"
                  helperText={t('ai.statusFlagged')}
                  onClick={() => setActiveTab('pending_routing')}
                />
                <OfficialStatCard
                  title={t('official.stats.inProgress')}
                  value={stats.inProgress}
                  icon={Clock}
                  colorTheme="amber"
                  helperText={t('status.in_progress')}
                  onClick={() => setActiveTab('in_progress')}
                />
                <OfficialStatCard
                  title={t('official.stats.resolved')}
                  value={stats.resolved}
                  icon={CheckCircle2}
                  colorTheme="emerald"
                  helperText={t('status.resolved')}
                  onClick={() => setActiveTab('resolved')}
                />
              </div>

              {/* Department Grievance Queue */}
              <OfficialGrievanceList
                grievances={grievances}
                loading={loadingData}
                onSelectGrievance={handleSelectGrievance}
                departmentName={tDept(departmentName)}
              />
            </>
          )}

          {/* TAB 2: All Department Grievances */}
          {activeTab === 'grievances' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <OfficialGrievanceList
                grievances={grievances}
                loading={loadingData}
                onSelectGrievance={handleSelectGrievance}
                departmentName={departmentName}
              />
            </div>
          )}

          {/* TAB 3: Pending AI Routing Notice */}
          {activeTab === 'pending_routing' && (
            <div className="space-y-6 max-w-3xl animate-in fade-in duration-150">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gov-100 text-gov-800 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gov-800 px-2.5 py-0.5 bg-gov-50 border border-gov-200 rounded-md">
                    Phase 8 Semantic AI Preview
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    Pending AI Routing Backlog ({stats.pendingRouting} unassigned)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Grievances with no assigned department are safely queued in the system awaiting <strong>Phase 8 AI Semantic Ticket Routing</strong> (powered by Sentence-BERT embeddings).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-slate-800">
                    <Info className="w-4 h-4 text-gov-700 shrink-0" />
                    <span>Department Isolation Policy:</span>
                  </div>
                  <p className="leading-relaxed">
                    Under strict government data isolation standards, unassigned tickets remain unmapped to specific departmental queues until classified by the authorized semantic engine.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: In Progress Queue */}
          {activeTab === 'in_progress' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <OfficialGrievanceList
                grievances={grievances.filter((g) => g.status === 'in_progress')}
                loading={loadingData}
                onSelectGrievance={handleSelectGrievance}
                departmentName={`${departmentName} (In Progress)`}
              />
            </div>
          )}

          {/* TAB 5: Resolved Queue */}
          {activeTab === 'resolved' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <OfficialGrievanceList
                grievances={grievances.filter((g) => g.status === 'resolved')}
                loading={loadingData}
                onSelectGrievance={handleSelectGrievance}
                departmentName={`${departmentName} (Resolved)`}
              />
            </div>
          )}

          {/* TAB 6: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  Official Desk Settings
                </h2>
                <p className="text-xs text-slate-500">
                  Manage official credential preferences and departmental configurations
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assigned Department Information
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">Department</span>
                      <span className="text-slate-500 text-[11px]">Assigned by administrative oversight</span>
                    </div>
                    <span className="font-bold text-gov-900 px-3 py-1 bg-white rounded-md border border-slate-200">
                      {departmentName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">Designation</span>
                      <span className="text-slate-500 text-[11px]">Official post held</span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {profile?.designation || 'Nodal Redressal Officer'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">Account Security</span>
                      <span className="text-slate-500 text-[11px]">Protected via Supabase cryptographic authentication</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs font-semibold text-gov-800 hover:text-gov-950 underline"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Grievance Details Drawer / Modal */}
      {selectedGrievance && (
        <OfficialGrievanceDetails
          grievance={selectedGrievance}
          onClose={() => setSelectedGrievance(null)}
          onUpdateStatus={handleUpdateStatus}
          updating={updatingStatus}
        />
      )}

      {/* Official Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        user={user}
      />

    </div>
  );
}
