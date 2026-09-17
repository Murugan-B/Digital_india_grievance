import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock, LogOut, ArrowLeft, Loader2, UserCheck } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-gov-800 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Verifying security session...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but profile is still resolving, show verification state
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-gov text-center space-y-4">
          <Loader2 className="w-8 h-8 text-gov-800 animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Verifying Security Credentials</h2>
          <p className="text-xs text-slate-600">
            Resolving role-based access authorizations for <strong>{user.email}</strong>...
          </p>
          <div className="pt-2">
            <button
              onClick={signOut}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userRole = profile.role;
  const accountStatus = profile.account_status || 'active';

  // 2. Suspended check
  if (accountStatus === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-200 shadow-gov text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Account Suspended</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            This account has been suspended by administrative oversight. Please contact the nodal helpdesk for assistance.
          </p>
          <button
            onClick={signOut}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Pending verification for official
  if (userRole === 'official' && accountStatus === 'pending' && allowedRoles.includes('official')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl border border-amber-200 shadow-gov text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold uppercase tracking-wider">
              Verification Pending
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              Departmental Verification Required
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your official registration for <strong>{profile?.department || 'Government Department'}</strong> is currently under review by the nodal administrator.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-left space-y-1">
            <p><strong>Registered Name:</strong> {profile?.full_name || user.email}</p>
            <p><strong>Official Email:</strong> {user.email}</p>
            <p><strong>Status:</strong> Pending Administrative Review</p>
          </div>
          <div className="pt-2 flex items-center justify-center space-x-3">
            <button
              onClick={signOut}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-all"
            >
              <span>Back to Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Role mismatch check
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-gov text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your role (<strong>{userRole}</strong>) does not have authorization to view this section.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={userRole === 'admin' ? '/admin' : userRole === 'official' ? '/official' : '/citizen'}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gov-900 text-white text-xs font-semibold rounded-lg"
            >
              <span>Go to Your Assigned Portal</span>
            </Link>
            <button
              onClick={signOut}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
