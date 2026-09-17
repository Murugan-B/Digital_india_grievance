import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-20 bg-gov-950 text-white relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gov-700/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-900/30 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gov-800/80 border border-gov-700 text-gov-200 text-xs font-semibold uppercase tracking-wider">
          <HeartHandshake className="w-3.5 h-3.5 text-gov-300" />
          <span>{t('navbar.portalTag', 'Citizen-Centric Governance')}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {t('home.heroTitle', 'Have a Grievance?')} <br />
          <span className="text-gov-300">{t('home.heroSubtitle', 'Empowering citizens with automated semantic ticket routing.')}</span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('footer.description', 'Submit your grievance and stay informed throughout the resolution process. Every citizen deserves transparent and timely civic redressal.')}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/submit-grievance"
            id="bottom-cta-submit-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gov-950 bg-white hover:bg-slate-100 rounded-lg shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-white group"
          >
            <span>{t('home.submitButton', 'SUBMIT GRIEVANCE')}</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 text-gov-900" />
          </Link>
          <Link
            to="/track"
            id="bottom-cta-track-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-gov-900/80 hover:bg-gov-900 border border-gov-700 rounded-lg transition-all"
          >
            <span>{t('home.trackButton', 'TRACK GRIEVANCE')}</span>
          </Link>
        </div>

        <div className="pt-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t('footer.workingHours', '24/7 Redressal Monitoring & Multilingual Support')}</span>
        </div>

      </div>
    </section>
  );
}
