import React from 'react';
import { ShieldCheck, Globe, Cpu, SearchCheck, CheckCircle } from 'lucide-react';

export default function AuthBranding() {
  const highlights = [
    {
      icon: Globe,
      title: 'Multilingual Support',
      desc: 'Submit and manage tickets in regional languages.',
    },
    {
      icon: Cpu,
      title: 'Semantic Smart Routing',
      desc: 'Automatic categorization to corresponding departments.',
    },
    {
      icon: SearchCheck,
      title: 'Transparent Milestone Tracking',
      desc: 'Audit each status transition in real-time.',
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-5/12 bg-gov-950 text-white p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gov-700/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-900/30 blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gov-800 flex items-center justify-center text-white border border-gov-700 shadow-md">
            <ShieldCheck className="w-6 h-6 text-gov-300" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-gov-300">
              Public Grievance
            </span>
            <span className="block text-lg font-bold text-white leading-tight">
              Redressal Portal
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-snug">
            Secure access to your grievance services.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Access your account to submit grievances, track progress and stay informed throughout the resolution process.
          </p>
        </div>
      </div>

      {/* Middle Highlights */}
      <div className="relative z-10 my-8 space-y-4">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-gov-900/70 border border-gov-800/80 flex items-start space-x-3 backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-gov-800 text-gov-300 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Trust & Assurance Footer */}
      <div className="relative z-10 pt-4 border-t border-gov-800/80 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-Based Access Control Ready</span>
        </div>
        <span>Phase 2 Preview</span>
      </div>
    </div>
  );
}
