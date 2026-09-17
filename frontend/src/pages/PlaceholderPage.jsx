import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Sparkles, FileText, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PlaceholderPage({ type = 'submit' }) {
  const isSubmit = type === 'submit';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-gov text-center space-y-6">
          
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gov-50 text-gov-800 border border-gov-200 flex items-center justify-center shadow-inner">
            {isSubmit ? (
              <FileText className="w-8 h-8 text-gov-700" />
            ) : (
              <Search className="w-8 h-8 text-gov-700" />
            )}
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold uppercase tracking-wider border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              <span>Coming in Next Phase</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {isSubmit ? 'Grievance Submission Form' : 'Live Grievance Tracking'}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {isSubmit
                ? 'The full multilingual grievance submission workflow with automated file attachment and category selection will be implemented in Phase 5.'
                : 'Real-time database querying and live status tracking backed by Supabase will be activated in subsequent phases.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-left space-y-1">
            <div className="font-semibold text-slate-700 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gov-700" />
              <span>Roadmap Details:</span>
            </div>
            <p>
              • Phase 1: Frontend Landing Page (Current)
            </p>
            <p>
              • Phase 2 & 3: Authentication & Role Management
            </p>
            <p>
              • Phase 4 & 5: Citizen Dashboard & Grievance Lodging
            </p>
            <p>
              • Phase 8: AI-Powered Semantic Ticket Routing (SBERT)
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gov-900 hover:bg-gov-950 rounded-lg shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Return to Landing Page</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
