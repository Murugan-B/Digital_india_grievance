import React from 'react';
import { Eye, Clock, Users, ShieldCheck } from 'lucide-react';

export default function IntroSection() {
  const pillars = [
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Clear visibility into each stage of your grievance from submission to closure with auditability.'
    },
    {
      icon: Users,
      title: 'Accessibility',
      description: 'Multilingual interface enabling every citizen to submit complaints in their regional language.'
    },
    {
      icon: Clock,
      title: 'Efficient Redressal',
      description: 'Direct semantic ticket routing to relevant authorities minimizing inter-departmental delays.'
    },
    {
      icon: ShieldCheck,
      title: 'Citizen Convenience',
      description: 'Single unified platform with tracking updates at every step of the resolution lifecycle.'
    }
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-block px-3 py-1 rounded-md bg-gov-100 text-gov-800 text-xs font-semibold tracking-wider uppercase">
            Platform Purpose
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Making Public Grievance Redressal <br className="hidden sm:inline" />
            <span className="text-gov-800">Simple and Transparent</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed pt-2">
            The portal provides citizens with a simple digital platform to register public grievances, track their progress and stay informed throughout the resolution process.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-subtle hover:border-gov-300 hover:shadow-gov transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gov-50 text-gov-800 flex items-center justify-center border border-gov-100 mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
