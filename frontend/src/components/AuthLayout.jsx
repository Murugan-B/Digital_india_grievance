import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Globe } from 'lucide-react';
import AuthBranding from './AuthBranding';
import Footer from './Footer';

export default function AuthLayout({ children, pageTitle }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Portal Utility Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            id="auth-back-to-home-btn"
            className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-gov-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1 text-gov-800" />
            <span>Back to Home</span>
          </Link>

          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gov-950 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-4 h-4 text-gov-300" />
            </div>
            <span className="text-sm font-bold text-slate-900 hidden sm:inline">
              Public Grievance Redressal Portal
            </span>
          </Link>

          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <Globe className="w-3.5 h-3.5 text-gov-700" />
            <span className="hidden sm:inline">Language:</span>
            <span className="font-semibold text-slate-700">English / தமிழ்</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-gov overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Column: Branding Sidebar (Desktop) */}
          <AuthBranding />

          {/* Right Column: Dynamic Form Container */}
          <div className="w-full lg:w-7/12 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">
            {children}
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
