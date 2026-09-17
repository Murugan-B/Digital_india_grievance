import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon: Icon,
  helperText,
  autoComplete,
  className = '',
}) {
  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`block w-full rounded-lg text-sm transition-all ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 py-2.5 bg-white border ${
            error
              ? 'border-red-500 text-red-900 focus:ring-2 focus:ring-red-400 focus:border-red-500'
              : 'border-slate-300 text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:ring-2 focus:ring-gov-600 focus:border-gov-600'
          } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
        />
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
    </div>
  );
}
