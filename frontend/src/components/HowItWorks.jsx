import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Edit3, Cpu, Network, CheckSquare } from 'lucide-react';

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      step: '01',
      title: t('home.step1Title', '1. File Your Complaint'),
      description: t('home.step1Desc', 'Submit your grievance in English or regional languages with supporting photo evidence.'),
      icon: Edit3,
      badge: t('common.submit', 'Submit'),
    },
    {
      step: '02',
      title: t('home.step2Title', '2. AI Semantic Routing'),
      description: t('home.step2Desc', 'Our high-precision NLP engine analyzes the context and automatically assigns it to the exact responsible department.'),
      icon: Cpu,
      badge: t('ai.semanticRouting', 'Analyse'),
    },
    {
      step: '03',
      title: t('home.step3Title', '3. Nodal Officer Action'),
      description: t('home.step3Desc', 'Designated department officials review, investigate, and update progress in real-time.'),
      icon: Network,
      badge: t('common.department', 'Route'),
    },
    {
      step: '04',
      title: t('home.step4Title', '4. Verified Resolution'),
      description: t('home.step4Desc', 'Citizens receive live notification updates and full resolution audit trails.'),
      icon: CheckSquare,
      badge: t('status.resolved', 'Resolve'),
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-block px-3 py-1 rounded-md bg-gov-100 text-gov-800 text-xs font-semibold tracking-wider uppercase">
            {t('home.badge', 'Digital India Workflow')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('home.howTitle', 'How the Portal Works')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            {t('home.howSubtitle', 'A transparent 4-step workflow from citizen submission to departmental resolution.')}
          </p>
        </div>

        {/* Process Steps */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {/* Subtle connecting bar for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 bg-slate-200 -translate-y-8 z-0" />

          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            return (
              <div 
                key={stepItem.step}
                className="relative z-10 flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-subtle hover:border-gov-400 hover:bg-white hover:shadow-gov transition-all group"
              >
                {/* Header row in step card */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gov-900 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-gov-800 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-300 font-mono">
                    {stepItem.step}
                  </span>
                </div>

                {/* Step Badge */}
                <div className="mb-2">
                  <span className="inline-block text-[11px] font-semibold text-gov-800 uppercase tracking-wider bg-gov-100 px-2 py-0.5 rounded">
                    {stepItem.badge}
                  </span>
                </div>

                {/* Step Content */}
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {stepItem.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  {stepItem.description}
                </p>

                {/* Bottom Step Indicator */}
                <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Step {index + 1} of 4</span>
                  <span className="font-semibold text-slate-500">24/7 Redressal</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
