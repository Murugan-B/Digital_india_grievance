import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Globe2, 
  BrainCircuit, 
  SearchCheck, 
  ShieldCheck, 
  BellRing, 
  LineChart 
} from 'lucide-react';

export default function Features() {
  const { t } = useLanguage();

  const featureList = [
    {
      icon: Globe2,
      title: t('home.feature2Title', 'Multi-Lingual Redressal'),
      description: t('home.feature2Desc', 'Full support for English, Tamil, Hindi, Telugu, Kannada, and Malayalam across the portal.'),
      color: 'text-gov-700 bg-gov-50 border-gov-200',
    },
    {
      icon: BrainCircuit,
      title: t('home.feature1Title', 'AI Semantic Routing'),
      description: t('home.feature1Desc', 'Sentence Transformers accurately categorize complex complaints beyond simple keyword matching.'),
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      icon: SearchCheck,
      title: t('home.trackingPreviewTitle', 'Real-Time Grievance Tracking'),
      description: t('citizen.trackPage.subtitle', 'Enter your 36-character Grievance Ticket UUID to view live progress and audit logs.'),
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: ShieldCheck,
      title: t('auth.roleSelection', 'Secure Role-Based Access (RBAC)'),
      description: t('auth.signUpSubtitle', 'Dedicated portals for verified citizens, department nodal officers, and central administrators.'),
      color: 'text-slate-800 bg-slate-100 border-slate-300',
    },
    {
      icon: BellRing,
      title: t('common.notifications', 'Real-time Notifications'),
      description: t('notifications.title', 'Instant alerts when complaints are routed, investigated, or resolved by department officials.'),
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      icon: LineChart,
      title: t('home.feature4Title', 'Transparent Audit Logs'),
      description: t('home.feature4Desc', 'Immutable time-stamped status change history accessible to both citizens and administrators.'),
      color: 'text-sky-700 bg-sky-50 border-sky-200',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-block px-3 py-1 rounded-md bg-gov-100 text-gov-800 text-xs font-semibold tracking-wider uppercase">
            {t('common.features', 'Core Capabilities')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('home.featuresTitle', 'Next-Generation Redressal Platform')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            {t('footer.description', 'A transparent, accessible and multilingual platform to submit, track and resolve public grievances.')}
          </p>
        </div>

        {/* Features 3x2 Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-subtle hover:border-gov-400 hover:shadow-gov transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border mb-5 ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{t('common.features', 'Feature')} 0{index + 1}</span>
                  <span className="font-medium text-gov-800">{t('home.activeDepartmentsCount', 'Digital India')}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
