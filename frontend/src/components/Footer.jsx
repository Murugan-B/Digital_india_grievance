import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gov-800 flex items-center justify-center text-white border border-gov-700">
                <ShieldCheck className="w-5 h-5 text-gov-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gov-400">
                  {t('navbar.govIndia', 'GOVERNMENT OF INDIA')}
                </span>
                <span className="text-base font-bold text-white leading-tight">
                  {t('footer.title', 'Public Grievance Redressal Portal')}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {t('footer.description', 'An automated semantic grievance routing platform aligned with Digital India standards, ensuring transparent, efficient, and accountable citizen grievance redressal.')}
            </p>

            <div className="pt-2 text-xs text-slate-500">
              <p>{t('footer.helpline', 'National Grievance Helpline: 1800-11-4000 (Toll Free)')}</p>
              <p>{t('footer.workingHours', 'Working Hours: 24/7 Redressal Monitoring')}</p>
            </div>
          </div>

          {/* Column 1: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {t('footer.quickLinks', 'Quick Links')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#home" className="text-slate-400 hover:text-white transition-colors">
                  {t('common.home', 'Home')}
                </a>
              </li>
              <li>
                <a href="/#about" className="text-slate-400 hover:text-white transition-colors">
                  {t('common.about', 'About')}
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors">
                  {t('common.howItWorks', 'How It Works')}
                </a>
              </li>
              <li>
                <a href="/#features" className="text-slate-400 hover:text-white transition-colors">
                  {t('common.features', 'Features')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Services */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {t('footer.citizenServices', 'Services')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/submit-grievance" className="text-slate-400 hover:text-white transition-colors flex items-center">
                  <span>{t('footer.submitGrievance', 'Submit Grievance')}</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-slate-400 hover:text-white transition-colors flex items-center">
                  <span>{t('footer.trackGrievance', 'Track Grievance')}</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/citizen" className="text-slate-400 hover:text-white transition-colors flex items-center">
                  <span>{t('footer.citizenPortal', 'Citizen Portal')}</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/official" className="text-slate-400 hover:text-white transition-colors flex items-center">
                  <span>{t('footer.officialPortal', 'Department Portal')}</span>
                  <ArrowUpRight className="w-3 h-3 ml-1 opacity-70" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {t('footer.emergencySupport', 'Support & Policies')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer">
                  {t('footer.privacyPolicy', 'Privacy Policy')}
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer">
                  {t('footer.termsOfService', 'Terms of Service')}
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer">
                  {t('footer.accessibility', 'Accessibility Statement')}
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{t('footer.copyright', '© 2026 Public Grievance Redressal Portal. Content owned by DARPG.')}</p>
          <div className="flex items-center space-x-4">
            <span>{t('navbar.portalTag', 'Digital India Initiative')}</span>
            <span>•</span>
            <span>24/7 Redressal Monitoring</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
