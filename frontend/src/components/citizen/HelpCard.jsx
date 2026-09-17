import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';

export default function HelpCard() {
  return (
    <div className="bg-gradient-to-br from-gov-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-gov border border-gov-800/80 relative overflow-hidden flex flex-col justify-between">
      {/* Background glow accent */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gov-600/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        <div className="w-10 h-10 rounded-xl bg-gov-800 text-gov-300 border border-gov-700 flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          Need help with your grievance?
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          You can submit a grievance related to eligible public services and track its progress through this portal.
        </p>

        <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Multilingual ticket intake</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Automated semantic department routing</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-5 border-t border-gov-800/80 mt-4 flex items-center justify-between">
        <Link
          to="/#how-it-works"
          className="inline-flex items-center text-xs font-bold text-gov-300 hover:text-white transition-colors group"
        >
          <span>Learn How It Works</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
        </Link>
        <span className="text-[10px] text-slate-400 font-mono">Phase 4</span>
      </div>
    </div>
  );
}
