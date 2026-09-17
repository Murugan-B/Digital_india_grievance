import React, { useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { User, Mail, Phone, Globe, ShieldCheck, CheckCircle2, X } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, profile, user }) {
  const { t, language } = useLanguage();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-lg rounded-2xl shadow-gov border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gov-800 text-white flex items-center justify-center border border-gov-700">
              <User className="w-5 h-5 text-gov-300" />
            </div>
            <div>
              <h3 id="profile-modal-title" className="text-base font-bold text-white">
                {t('common.profile')}
              </h3>
              <span className="text-xs text-slate-400">
                {t('citizen.verifiedBadge')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                {t('auth.fullName')}
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {profile?.full_name || user?.user_metadata?.full_name || 'N/A'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                {t('auth.email')}
              </span>
              <span className="text-sm font-mono text-slate-900 block truncate">
                {user?.email || profile?.email || 'N/A'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                {t('auth.phone')}
              </span>
              <span className="text-sm font-medium text-slate-900 block">
                {profile?.mobile_number || user?.user_metadata?.mobile_number || 'N/A'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                {t('citizen.submitPage.langLabel')}
              </span>
              <span className="text-sm font-bold text-slate-900 uppercase block">
                {profile?.preferred_language || user?.user_metadata?.preferred_language || language || 'English'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                {t('auth.roleCitizen')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gov-100 text-gov-800">
                {t('auth.roleCitizen')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block">
                {t('common.status')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {profile?.account_status || t('common.success')}
              </span>
            </div>

          </div>

          <div className="p-3 bg-gov-50 border border-gov-200 rounded-xl flex items-center space-x-2 text-[11px] text-gov-900">
            <ShieldCheck className="w-4 h-4 text-gov-700 shrink-0" />
            <span>{t('auth.verifiedBadge')} — RLS Protected</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gov-900 hover:bg-gov-950 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            {t('common.close')}
          </button>
        </div>

      </div>
    </div>
  );
}
