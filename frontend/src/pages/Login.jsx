import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Mail, ArrowRight, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import RoleSelector from '../components/RoleSelector';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const { signIn, isSupabaseConfigured, resendVerificationEmail } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('citizen');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = t('auth.validation.emailRequired', 'Email address is required');
    } else if (identifier.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.trim())) {
        newErrors.identifier = t('auth.validation.emailInvalid', 'Please enter a valid email address');
      }
    } else {
      newErrors.identifier = t('auth.validation.emailInvalid', 'Supabase Auth requires a registered email address');
    }

    if (!password) {
      newErrors.password = t('auth.validation.passwordRequired', 'Password is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return;
    setResendingEmail(true);
    setResendStatus(null);
    try {
      await resendVerificationEmail(unconfirmedEmail);
      setResendStatus('Verification link re-sent! Please check your inbox (and spam folder).');
    } catch (err) {
      console.error('[Resend error]:', err);
      setResendStatus(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setUnconfirmedEmail(null);
    setResendStatus(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(identifier, password);
      const userProfile = result.profile;

      if (!userProfile || !userProfile.role) {
        throw new Error('Authentication succeeded, but user profile could not be loaded. Please ensure database connectivity and try again.');
      }

      const userRole = userProfile.role;
      const accountStatus = userProfile.account_status || 'active';

      // Status check
      if (accountStatus === 'suspended') {
        setServerError('This account is suspended. Please contact portal administrator.');
        setLoading(false);
        return;
      }

      if (userRole === 'official' && accountStatus === 'pending') {
        setServerError(t('auth.officialPendingApprovalNotice', 'Your official account is currently pending administrative verification.'));
        setLoading(false);
        return;
      }

      // Successful redirect based strictly on verified user role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'official') {
        navigate('/official', { replace: true });
      } else {
        navigate('/citizen', { replace: true });
      }
    } catch (err) {
      console.error('[Login Exception]:', err);
      const msg = err.message ? err.message.toLowerCase() : '';
      if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
        setServerError('Invalid email or password. Please verify your credentials and try again.');
      } else if (msg.includes('email not confirmed')) {
        setUnconfirmedEmail(identifier.trim());
        setServerError(
          'Email not confirmed. Please check your inbox for the confirmation link before signing in.'
        );
      } else if (!isSupabaseConfigured) {
        setServerError(
          'Supabase credentials pending in .env.local. Please provide your Supabase project URL and publishable key to authenticate.'
        );
      } else {
        setServerError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout pageTitle={t('auth.welcomeBack', 'Sign In to Portal')}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gov-800">
            {t('common.portalName', 'Public Grievance Redressal Portal')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('auth.welcomeBack', 'Welcome Back')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('auth.signInSubtitle', 'Sign in to access your grievance portal account')}
          </p>
        </div>

        {/* Role Selector */}
        <RoleSelector selectedRole={role} onSelectRole={setRole} />

        {/* Role Specific Notices */}
        {role === 'official' && (
          <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>{t('auth.roleOfficial', 'Government Official')}:</strong> {t('auth.officialPendingApprovalNotice', 'Official accounts require administrative verification before dashboard access is granted.')}
            </span>
          </div>
        )}

        {role === 'admin' && (
          <div className="flex items-start space-x-2 p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-800">
            <ShieldAlert className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <span>
              <strong>{t('auth.roleAdmin', 'Administrator')}:</strong> {t('auth.adminRoleNotice', 'Administrator credentials are pre-provisioned by the Central System Authority.')}
            </span>
          </div>
        )}

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{serverError}</span>
            </div>

            {unconfirmedEmail && (
              <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-[11px] text-amber-800">
                  Didn't receive or need a new link?
                </p>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                  className="inline-flex items-center justify-center px-3 py-1 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white rounded text-[11px] font-semibold transition"
                >
                  {resendingEmail ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      <span>{t('common.loading', 'Sending...')}</span>
                    </>
                  ) : (
                    <span>Resend Verification Email</span>
                  )}
                </button>
              </div>
            )}

            {resendStatus && (
              <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 p-2 rounded">
                {resendStatus}
              </p>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
          <FormInput
            id="login-identifier"
            label={t('auth.email', 'Registered Email')}
            type="email"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors({ ...errors, identifier: null });
            }}
            placeholder={
              role === 'official'
                ? 'officer@department.gov.in'
                : role === 'admin'
                ? 'admin@grievance.gov.in'
                : 'citizen@example.com'
            }
            icon={Mail}
            error={errors.identifier}
            required
            autoComplete="email"
          />

          <PasswordInput
            id="login-password"
            label={t('auth.password', 'Password')}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
            error={errors.password}
            required
            autoComplete="current-password"
          />

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                id="remember-me-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-gov-800 rounded border-slate-300 focus:ring-gov-600 focus:ring-2"
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              id="login-forgot-password-link"
              className="font-medium text-gov-800 hover:text-gov-950 hover:underline transition-colors"
            >
              {t('auth.forgotPassword', 'Forgot Password?')}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 focus:ring-2 focus:ring-offset-2 focus:ring-gov-800 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>{t('common.loading', 'Signing in...')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.loginAs', 'LOGIN AS')} {(role || 'citizen').toUpperCase()}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Register Navigation Callout */}
        <div className="pt-4 border-t border-slate-200 text-center text-xs sm:text-sm text-slate-600">
          <span>{t('auth.noAccount', "Don't have an account?")} </span>
          <Link
            to="/register"
            id="login-register-link"
            className="font-bold text-gov-800 hover:text-gov-950 hover:underline transition-colors"
          >
            {t('common.register', 'Register here')}
          </Link>
        </div>

        {/* Security Indicator */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-[11px] text-slate-500">
          <span>Encrypted Session • Digital India Security Standards</span>
        </div>

      </div>
    </AuthLayout>
  );
}
