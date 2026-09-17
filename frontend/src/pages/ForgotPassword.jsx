import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';

export default function ForgotPassword() {
  const { resetPassword, isSupabaseConfigured } = useAuth();
  const { t } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitFeedback(null);

    if (!identifier.trim()) {
      setError(t('auth.validation.emailRequired', 'Please enter your registered Email address'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier.trim())) {
      setError(t('auth.validation.emailInvalid', 'Please enter a valid registered email address'));
      return;
    }

    setLoading(true);

    try {
      await resetPassword(identifier);
      setSubmitFeedback({
        type: 'success',
        title: t('common.success', 'Recovery Email Dispatched'),
        message: `Password reset instructions have been sent to ${identifier}. Please click the link in your email to set a new password.`,
      });
    } catch (err) {
      console.error('[ForgotPassword error]:', err);
      if (!isSupabaseConfigured) {
        setError('Supabase credentials pending in .env.local.');
      } else {
        setError(err.message || 'Failed to dispatch recovery email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout pageTitle={t('auth.resetPasswordTitle', 'Password Recovery')}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gov-50 text-gov-800 border border-gov-200 flex items-center justify-center shadow-inner">
            <KeyRound className="w-6 h-6 text-gov-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('auth.resetPasswordTitle', 'Reset Your Password')}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t('auth.resetPasswordSubtitle', 'Enter your registered email address to receive password recovery instructions.')}
          </p>
        </div>

        {/* Feedback / Success Banner */}
        {submitFeedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-1 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{submitFeedback.title}</span>
            </div>
            <p className="pl-6 text-emerald-800 leading-relaxed">
              {submitFeedback.message}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Recovery Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInput
            id="recovery-identifier"
            label={t('auth.email', 'Registered Email Address')}
            type="email"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. citizen@example.com"
            icon={Mail}
            error={error}
            required
            autoComplete="email"
          />

          <button
            type="submit"
            id="forgot-password-submit-btn"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 focus:ring-2 focus:ring-offset-2 focus:ring-gov-800 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>{t('common.loading', 'Sending instructions...')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.sendResetLink', 'SEND RESET INSTRUCTIONS')}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <Link
            to="/login"
            id="back-to-login-link"
            className="inline-flex items-center text-sm font-semibold text-gov-800 hover:text-gov-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>{t('auth.backToLogin', 'Back to Login')}</span>
          </Link>
        </div>

      </div>
    </AuthLayout>
  );
}
