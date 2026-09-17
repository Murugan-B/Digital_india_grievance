import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Menu, X, ChevronDown, Check, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { language, setLanguage, currentLanguage, languages, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef(null);
  const location = useLocation();

  const userRole = profile?.role || user?.user_metadata?.role || 'citizen';
  const dashboardPath = userRole === 'admin' ? '/admin' : userRole === 'official' ? '/official' : '/citizen';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: t('common.home', 'Home'), href: '/#home' },
    { name: t('common.about', 'About'), href: '/#about' },
    { name: t('common.howItWorks', 'How It Works'), href: '/#how-it-works' },
    { name: t('common.features', 'Features'), href: '/#features' },
  ];

  const handleNavClick = (href) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      return;
    }
    const targetId = href.replace('/#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-white border-b border-slate-200'}`}>
      {/* Top micro-bar for accessibility & portal designation */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium tracking-wide">{t('navbar.govIndia', 'GOVERNMENT OF INDIA')} • {t('common.portalName', 'Public Grievance Redressal Portal')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 hidden sm:inline">{t('navbar.portalTag', 'Digital India Initiative')}</span>
            <span className="text-emerald-400 text-[11px] font-semibold">24/7 Redressal Active</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main Navigation">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Emblem & Name */}
          <Link to="/" className="flex items-center space-x-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-lg bg-gov-950 flex items-center justify-center text-white shadow-md border border-gov-800 transition-transform group-hover:scale-105">
              <ShieldCheck className="w-6 h-6 text-gov-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-gov-800">
                {t('navbar.govIndia', 'GOVERNMENT OF INDIA')}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t('common.portalName', 'Public Grievance Portal')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (location.pathname === '/') {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }
                }}
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-gov-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Side Tools & CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                id="language-selector-button"
                aria-expanded={langDropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('common.selectLanguage', 'Select Language')}
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-md hover:bg-slate-100 focus:ring-2 focus:ring-gov-600 transition"
              >
                <Globe className="w-4 h-4 text-gov-700" />
                <span>{currentLanguage.native}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {langDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  role="listbox"
                >
                  <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    {t('common.selectLanguage', 'Select Language')}
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={language === lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-gov-50 transition-colors ${
                        language === lang.code ? 'text-gov-800 font-semibold bg-gov-50' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{lang.native}</span>
                        <span className="text-xs text-slate-400">{lang.label}</span>
                      </div>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-gov-700" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Authenticated User state vs Login Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={dashboardPath}
                  id="navbar-dashboard-link"
                  className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-gov-950 bg-gov-100 hover:bg-gov-200 border border-gov-300 rounded-lg shadow-sm transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-gov-800" />
                  <span>{(userRole || 'citizen').toUpperCase()} {t('common.dashboard', 'DASHBOARD').toUpperCase()}</span>
                </Link>

                <button
                  type="button"
                  id="navbar-logout-btn"
                  onClick={signOut}
                  className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-300 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span>{t('common.logout', 'Logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                id="desktop-login-button"
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-gov-900 hover:bg-gov-950 rounded-md shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-offset-2 focus:ring-gov-800"
              >
                {t('navbar.login', 'LOGIN')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gov-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (location.pathname === '/') {
                    e.preventDefault();
                    handleNavClick(link.href);
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
                className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-gov-900 hover:bg-slate-50 rounded-md"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Language Selector in Mobile */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              {t('common.selectLanguage', 'Select Language')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-md border text-left ${
                    language === lang.code
                      ? 'border-gov-600 bg-gov-50 text-gov-900 font-semibold'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span>{lang.native}</span>
                  {language === lang.code && (
                    <Check className="w-3.5 h-3.5 text-gov-700" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Auth Button */}
          <div className="pt-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-bold text-gov-950 bg-gov-100 border border-gov-300 rounded-md shadow-sm"
                >
                  <span>{t('navbar.goToDashboard', 'GO TO DASHBOARD')} ({(userRole || 'citizen').toUpperCase()})</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md"
                >
                  {t('common.signOut', 'Sign Out')} ({profile?.full_name || user?.email})
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center px-4 py-2.5 text-base font-semibold text-white bg-gov-900 hover:bg-gov-950 rounded-md shadow-sm"
              >
                {t('navbar.login', 'LOGIN')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
