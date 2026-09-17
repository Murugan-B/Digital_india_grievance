import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../lib/adminApi';

import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminOverview from '../components/admin/AdminOverview';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminOfficialVerification from '../components/admin/AdminOfficialVerification';
import AdminGrievanceManagement from '../components/admin/AdminGrievanceManagement';
import AdminAIRoutingReview from '../components/admin/AdminAIRoutingReview';
import AdminDepartmentManagement from '../components/admin/AdminDepartmentManagement';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminSecurityProfile from '../components/admin/AdminSecurityProfile';
import { AdminLoadingSkeleton, AdminErrorState } from '../components/admin/AdminStates';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsData, deptData] = await Promise.all([
        adminApi.getSystemStats(),
        adminApi.getDepartments(),
      ]);

      setStats(statsData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setError(err.message || 'Failed to initialize administrative dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800">
      {/* 1. Header */}
      <AdminHeader
        adminProfile={profile}
        onRefresh={() => loadDashboardData(true)}
        refreshing={refreshing}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        mobileSidebarOpen={mobileSidebarOpen}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            pendingOfficialsCount={stats?.users?.pendingOfficials || 0}
            flaggedAICount={stats?.ai?.flaggedForReview || 0}
            unassignedCount={stats?.grievances?.unassigned || 0}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-50 w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col">
              <AdminSidebar
                activeTab={activeTab}
                onSelectTab={handleTabChange}
                pendingOfficialsCount={stats?.users?.pendingOfficials || 0}
                flaggedAICount={stats?.ai?.flaggedForReview || 0}
                unassignedCount={stats?.grievances?.unassigned || 0}
                onCloseMobile={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {loading ? (
            <AdminLoadingSkeleton count={6} />
          ) : error ? (
            <AdminErrorState message={error} onRetry={() => loadDashboardData()} />
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverview stats={stats} onNavigate={handleTabChange} />
              )}

              {activeTab === 'analytics' && (
                <AdminAnalytics />
              )}

              {activeTab === 'verification' && (
                <AdminOfficialVerification onOfficialUpdated={() => loadDashboardData(true)} />
              )}

              {activeTab === 'grievances' && (
                <AdminGrievanceManagement
                  departments={departments}
                  onGrievanceUpdated={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'ai_review' && (
                <AdminAIRoutingReview
                  departments={departments}
                  onRoutingUpdated={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'departments' && (
                <AdminDepartmentManagement
                  departments={departments}
                  onRefresh={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'users' && (
                <AdminUserManagement currentAdminId={user?.id} />
              )}

              {activeTab === 'profile' && <AdminSecurityProfile />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
