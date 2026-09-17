import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  BadgeCheck, 
  Globe, 
  ArrowRight, 
  ShieldAlert, 
  AlertCircle,
  Loader2,
  MailCheck
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import RoleSelector from '../components/RoleSelector';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';

const DEPARTMENTS = [
  'Water Supply',
  'Electricity',
  'Roads & Transport',
  'Sanitation',
  'Municipal Services',
  'Public Health',
  'Revenue',
  'Education',
];

export default function Register() {
  const { signUp, isSupabaseConfigured } = useAuth();
  const { t, tDept, languages } = useLanguage();

  const [role, setRole] = useState('citizen');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [designation, setDesignation] = useState('');
  const [preferredLang, setPreferredLang] = useState('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = t('auth.validation.fullNameRequired', 'Full name is required');
    }

    if (!email.trim()) {
      newErrors.email = t('auth.validation.emailRequired', 'Email address is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = t('auth.validation.emailInvalid', 'Please enter a valid email address');
      }
    }

    if (!mobile.trim()) {
      newErrors.mobile = t('auth.validation.phoneRequired', 'Mobile number is required');
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      newErrors.mobile = t('auth.validation.phoneRequired', 'Mobile number must be exactly 10 digits');
    }

    if (role === 'official') {
      if (!designation.trim()) {
        newErrors.designation = t('auth.validation.designationRequired', 'Official designation is required');
      }
    }

    if (!password) {
      newErrors.password = t('auth.validation.passwordRequired', 'Password is required');
    } else {
      const hasLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

      if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
        newErrors.password = t('auth.validation.passwordLength', 'Password must meet all 4 strength requirements (min 8 chars, uppercase, lowercase, number)');
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordRequired', 'Confirmation password is required');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordsMatch', 'Passwords do not match');
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms & Privacy Policy to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setRegistrationSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const metadata = {
        full_name: fullName.trim(),
        role: role,
        phone: mobile.trim(),
        preferred_language: preferredLang,
      };

      if (role === 'official') {
        metadata.department = department;
        metadata.designation = designation.trim();
        metadata.account_status = 'pending';
      } else if (role === 'admin') {
        metadata.account_status = 'active';
      } else {
        metadata.account_status = 'active';
      }

      const result = await signUp(email.trim(), password, metadata);

      if (result.session) {
        setRegistrationSuccess({
          message: 'Account registered successfully! You are signed in.',
          isAutoConfirmed: true,
          role: role,
        });
      } else {
        setRegistrationSuccess({
          message: 'Registration initiated. A verification link has been sent to your email.',
          email: email.trim(),
          isAutoConfirmed: false,
          role: role,
        });
      }
    } catch (err) {
      console.error('[Register error]:', err);
      const msg = err.message ? err.message.toLowerCase() : '';
      if (msg.includes('user already registered') || msg.includes('already exists')) {
        setServerError('An account with this email address already exists. Please sign in.');
      } else if (!isSupabaseConfigured) {
        setServerError('Supabase configuration missing in .env.local.');
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout pageTitle={t('auth.createAccount', 'Create Account')}>
      <div className="space-y-6">
        
        {/* Success State */}
        {registrationSuccess ? (
          <div className="p-6 bg-white border border-emerald-200 rounded-2xl shadow-gov text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
              <MailCheck className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                {t('common.success', 'Account Registered Successfully!')}
              </h2>
              <p className="text-sm text-slate-600">
                {registrationSuccess.message}
              </p>
            </div>

            {registrationSuccess.role === 'official' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left space-y-1">
                <span className="font-bold block">{t('auth.roleOfficial', 'Department Nodal Officer Account')}:</span>
                <p>{t('auth.officialPendingApprovalNotice', 'Official accounts require administrative verification before departmental access is granted.')}</p>
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/login"
                id="registration-success-login-btn"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-gov-900 hover:bg-gov-950 text-white text-sm font-semibold rounded-lg shadow-sm transition"
              >
                <span>{t('auth.backToLogin', 'Proceed to Sign In')}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gov-800">
                {t('common.portalName', 'Public Grievance Redressal Portal')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('auth.createAccount', 'Create Account')}
              </h1>
              <p className="text-sm text-slate-600">
                {t('auth.signUpSubtitle', 'Register as a citizen or request departmental access')}
              </p>
            </div>

            {/* Role Selector */}
            <RoleSelector selectedRole={role} onSelectRole={setRole} />

            {/* Role Notice */}
            {role === 'official' && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>{t('auth.roleOfficial', 'Official Notice')}:</strong> {t('auth.officialPendingApprovalNotice', 'Official accounts require administrative verification before dashboard access is granted.')}
                </span>
              </div>
            )}

            {/* Server Error Alert */}
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
              
              <FormInput
                id="register-fullname"
                label={t('auth.fullName', 'Full Legal Name')}
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: null });
                }}
                placeholder={t('auth.fullNamePlaceholder', 'e.g. Ramesh Kumar')}
                icon={User}
                error={errors.fullName}
                required
                autoComplete="name"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  id="register-email"
                  label={t('auth.email', 'Email Address')}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder={role === 'official' ? 'officer@dept.gov.in' : 'name@example.com'}
                  icon={Mail}
                  error={errors.email}
                  required
                  autoComplete="email"
                />

                <FormInput
                  id="register-mobile"
                  label={t('auth.phone', 'Mobile Number')}
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobile(val);
                    if (errors.mobile) setErrors({ ...errors, mobile: null });
                  }}
                  placeholder={t('auth.phonePlaceholder', '10-digit mobile')}
                  icon={Phone}
                  error={errors.mobile}
                  required
                  autoComplete="tel"
                />
              </div>

              {/* Official Specific Fields */}
              {role === 'official' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label htmlFor="official-department" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {t('auth.officialDepartment', 'Department')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-4 h-4" />
                      </div>
                      <select
                        id="official-department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-gov-600 focus:border-gov-600"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {tDept(dept)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <FormInput
                    id="official-designation"
                    label={t('auth.designation', 'Designation')}
                    type="text"
                    value={designation}
                    onChange={(e) => {
                      setDesignation(e.target.value);
                      if (errors.designation) setErrors({ ...errors, designation: null });
                    }}
                    placeholder={t('auth.designationPlaceholder', 'e.g. Assistant Engineer')}
                    icon={BadgeCheck}
                    error={errors.designation}
                    required
                  />
                </div>
              )}

              {/* Citizen Preferred Language */}
              {role === 'citizen' && (
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="preferred-language" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t('citizen.submitPage.langLabel', 'Preferred Portal Language')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <select
                      id="preferred-language"
                      value={preferredLang}
                      onChange={(e) => setPreferredLang(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 hover:border-slate-400 focus:ring-2 focus:ring-gov-600 focus:border-gov-600"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.native} ({lang.label})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <PasswordInput
                  id="register-password"
                  label={t('auth.password', 'Password')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  placeholder={t('auth.passwordPlaceholder', 'Create strong password')}
                  error={errors.password}
                  required
                  showStrengthMeter={true}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <PasswordInput
                  id="register-confirm-password"
                  label={t('auth.confirmPassword', 'Confirm Password')}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                  }}
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter password')}
                  error={errors.confirmPassword}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: null });
                    }}
                    className="w-4 h-4 mt-0.5 text-gov-800 rounded border-slate-300 focus:ring-gov-600 focus:ring-2 shrink-0"
                  />
                  <span>
                    I agree to the <span className="font-semibold text-gov-800 hover:underline">Citizen Charter</span>, <span className="font-semibold text-gov-800 hover:underline">{t('footer.termsOfService', 'Terms of Redressal')}</span>, and {t('footer.privacyPolicy', 'Privacy Policy')}.
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-xs text-red-600 mt-1 pl-6">
                    {errors.agreeTerms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                id="register-submit-btn"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 focus:ring-2 focus:ring-offset-2 focus:ring-gov-800 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>{t('common.loading', 'Creating account...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.createRoleAccount', 'CREATE ACCOUNT')} ({(role || 'citizen').toUpperCase()})</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 text-center text-xs sm:text-sm text-slate-600">
              <span>{t('auth.alreadyHaveAccount', 'Already have an account?')} </span>
              <Link
                to="/login"
                id="register-login-link"
                className="font-bold text-gov-800 hover:text-gov-950 hover:underline transition-colors"
              >
                {t('common.login', 'Login here')}
              </Link>
            </div>
          </>
        )}

      </div>
    </AuthLayout>
  );
}
