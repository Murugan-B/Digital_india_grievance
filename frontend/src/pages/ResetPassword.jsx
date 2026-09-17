import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password) {
      setError('Please enter a new password');
      return;
    }

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
      setError('Password must meet all 4 strength requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err) {
      console.error('[ResetPassword error]:', err);
      setError(err.message || 'Failed to update password. Recovery link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout pageTitle="Update Password">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gov-50 text-gov-800 border border-gov-200 flex items-center justify-center shadow-inner">
            <KeyRound className="w-6 h-6 text-gov-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Set New Password
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Enter your new secure password below to regain full access to your grievance account.
          </p>
        </div>

        {/* Success Banner */}
        {success ? (
          <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-emerald-900">
              Password Updated Successfully!
            </h2>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Your account password has been updated. You can now sign in with your new credentials.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gov-900 hover:bg-gov-950 text-white text-sm font-semibold rounded-lg shadow-sm"
            >
              <span>Proceed to Login</span>
            </Link>
          </div>
        ) : (
          /* Password Form */
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <PasswordInput
              id="new-password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new strong password"
              required
              showStrengthMeter={true}
              autoComplete="new-password"
            />

            <PasswordInput
              id="confirm-new-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gov-900 hover:bg-gov-950 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>UPDATE PASSWORD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </AuthLayout>
  );
}
