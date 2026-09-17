import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, Check, X } from 'lucide-react';

export default function PasswordInput({
  id,
  label = 'Password',
  value = '',
  onChange,
  placeholder = '••••••••',
  error,
  required = false,
  showStrengthMeter = false,
  helperText,
  autoComplete = 'current-password',
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Calculate password strength based on criteria
  const strengthDetails = useMemo(() => {
    if (!value) return { score: 0, label: '', checks: [] };

    const checks = [
      { id: 'len', label: 'At least 8 characters', pass: value.length >= 8 },
      { id: 'upper', label: 'One uppercase letter', pass: /[A-Z]/.test(value) },
      { id: 'lower', label: 'One lowercase letter', pass: /[a-z]/.test(value) },
      { id: 'num', label: 'One number', pass: /[0-9]/.test(value) },
    ];

    const passedCount = checks.filter((c) => c.pass).length;
    let score = 0;
    let label = 'Weak';
    let colorClass = 'bg-red-500';

    if (passedCount === 1) {
      score = 25;
      label = 'Weak';
      colorClass = 'bg-red-500';
    } else if (passedCount === 2) {
      score = 50;
      label = 'Fair';
      colorClass = 'bg-amber-500';
    } else if (passedCount === 3) {
      score = 75;
      label = 'Good';
      colorClass = 'bg-blue-500';
    } else if (passedCount === 4) {
      score = 100;
      label = 'Strong';
      colorClass = 'bg-emerald-600';
    }

    return { score, label, colorClass, checks, passedCount };
  }, [value]);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Lock className="w-4 h-4" />
        </div>

        <input
          id={id}
          name={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`block w-full rounded-lg text-sm transition-all pl-10 pr-11 py-2.5 bg-white border ${
            error
              ? 'border-red-500 text-red-900 focus:ring-2 focus:ring-red-400 focus:border-red-500'
              : 'border-slate-300 text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:ring-2 focus:ring-gov-600 focus:border-gov-600'
          }`}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-800"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error ? (
        <p id={`${id}-error`} className="flex items-center text-xs text-red-600 space-x-1 pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-slate-500 pt-0.5">
          {helperText}
        </p>
      ) : null}

      {/* Password Strength UI */}
      {showStrengthMeter && value.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Password Strength:</span>
            <span className={`font-bold ${
              strengthDetails.score === 100 ? 'text-emerald-700' :
              strengthDetails.score >= 75 ? 'text-blue-700' :
              strengthDetails.score >= 50 ? 'text-amber-700' : 'text-red-700'
            }`}>
              {strengthDetails.label}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strengthDetails.colorClass}`}
              style={{ width: `${strengthDetails.score}%` }}
            />
          </div>

          {/* Requirements Checklist */}
          <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
            {strengthDetails.checks.map((c) => (
              <div
                key={c.id}
                className={`flex items-center space-x-1 ${
                  c.pass ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {c.pass ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3 h-3 text-slate-300 shrink-0" />
                )}
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
