import React from 'react';
import { ShieldCheck, Lock, User, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSecurityProfile() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-gov-800" />
          <span>Administrator Security & Access Profile</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Identity credentials, verified role clearances, and session security parameters.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gov-800 to-slate-900 text-amber-300 font-extrabold text-xl flex items-center justify-center border border-gov-700 shadow-sm">
            AD
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900">{profile?.full_name || 'Administrator'}</h3>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px] uppercase">
                Root Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Verified Role</span>
            <p className="text-sm font-bold text-gov-950 uppercase">{profile?.role || 'admin'}</p>
            <p className="text-[11px] text-slate-500">Unrestricted system oversight & department configuration.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Account Clearance</span>
            <p className="text-sm font-bold text-emerald-700 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Active / Nodal Verified</span>
            </p>
            <p className="text-[11px] text-slate-500">Subject to server-side token validation.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Security Protections</span>
            <p className="text-xs font-semibold text-slate-800">Anti-Self-Demotion & Anti-Self-Promotion Enforced</p>
            <p className="text-[11px] text-slate-500">Backend strictly prevents changing your own admin role.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Portal Isolation</span>
            <p className="text-xs font-semibold text-slate-800">Protected API Endpoints (/api/admin/*)</p>
            <p className="text-[11px] text-slate-500">All queries require server-side profile verification.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">Session ID: {user?.id}</span>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition"
          >
            Sign Out Administrative Session
          </button>
        </div>
      </div>
    </div>
  );
}
