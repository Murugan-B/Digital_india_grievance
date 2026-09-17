import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, 
  FileText, 
  Cpu, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Shield, 
  Layers
} from 'lucide-react';

export default function Hero() {
  const { t } = useLanguage();

  const workflowNodes = [
    {
      id: 'citizen',
      label: t('auth.roleCitizen', 'Citizen'),
      desc: t('home.step1Desc', 'Submits grievance with evidence'),
      icon: User,
      bgColor: 'bg-slate-100 text-slate-700 border-slate-300',
      tag: 'Step 1'
    },
    {
      id: 'grievance',
      label: t('common.category', 'Grievance Intake'),
      desc: t('home.feature2Title', 'Multilingual regional intake'),
      icon: FileText,
      bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
      tag: 'Step 2'
    },
    {
      id: 'analysis',
      label: t('ai.semanticRouting', 'AI Semantic Analysis'),
      desc: t('ai.modelName', '384-d semantic classification'),
      icon: Cpu,
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      tag: 'Step 3'
    },
    {
      id: 'department',
      label: t('common.department', 'Department Action'),
      desc: t('home.step3Desc', 'Automated nodal officer routing'),
      icon: Building2,
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
      tag: 'Step 4'
    },
    {
      id: 'resolution',
      label: t('status.resolved', 'Resolution'),
      desc: t('home.step4Desc', 'Transparent audit closure'),
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tag: 'Step 5'
    }
  ];

  return (
    <section id="home" className="relative overflow-hidden bg-white border-b border-slate-200 py-12 md:py-20 lg:py-24">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gov-50 border border-gov-200 text-gov-800 text-xs font-semibold tracking-wide">
              <Shield className="w-3.5 h-3.5 text-gov-700" />
              <span>{t('home.badge', 'Digital India AI Initiative 2026')}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {t('home.heroTitle', 'Transparent, Rapid Public Grievance Redressal')}
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t('home.heroSubtitle', 'Empowering 1.4 billion citizens with automated semantic ticket routing across government departments in your native language.')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                to="/submit-grievance"
                id="hero-submit-grievance-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-gov-900 hover:bg-gov-950 rounded-lg shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gov-800 group"
              >
                <span>{t('home.submitButton', 'SUBMIT GRIEVANCE')}</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                to="/track"
                id="hero-track-grievance-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all hover:border-slate-400"
              >
                <Search className="w-4 h-4 mr-2 text-slate-500" />
                <span>{t('home.trackButton', 'TRACK GRIEVANCE STATUS')}</span>
              </Link>
            </div>

            {/* Trust Assurance Pills */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{t('home.activeDepartmentsCount', '8 Active Ministries')}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>{t('home.aiSpeed', '< 10ms AI Semantic Routing')}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>{t('home.secureResolution', '100% Transparent Redressal')}</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Visual Workflow Representation */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-gov relative">
              
              {/* Header inside Visual Card */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-gov-800" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('home.howTitle', 'Automated Redressal Flow')}
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                  {t('status.completed', 'Live Flow')}
                </span>
              </div>

              {/* Connected Flow Diagram */}
              <div className="mt-5 space-y-3 relative">
                {workflowNodes.map((node, index) => {
                  const Icon = node.icon;
                  return (
                    <div key={node.id} className="relative">
                      <div className="flex items-center p-3 rounded-xl bg-white border border-slate-200 hover:border-gov-400 transition-all shadow-subtle group">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border mr-3 shrink-0 ${node.bgColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 truncate">
                              {node.label}
                            </h2>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {node.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {node.desc}
                          </p>
                        </div>
                      </div>

                      {/* Connector Line for steps (except last) */}
                      {index < workflowNodes.length - 1 && (
                        <div className="flex justify-center my-1">
                          <div className="w-0.5 h-3 bg-slate-300"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="mt-5 pt-4 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {t('home.howSubtitle', 'Semantic intelligence ensures tickets reach the exact division without manual delays.')}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
