import { en } from './en';
import { ta } from './ta';
import { hi } from './hi';
import { te } from './te';
import { kn } from './kn';
import { ml } from './ml';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', dir: 'ltr' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', dir: 'ltr' },
];

export const translations = {
  en,
  ta,
  hi,
  te,
  kn,
  ml,
};

/**
 * Resolves a nested key string (e.g. "common.submit") from the given dictionary.
 */
export function getNestedTranslation(dictionary, keyPath, fallback = '') {
  if (!dictionary || !keyPath) return fallback || keyPath;
  const parts = keyPath.split('.');
  let current = dictionary;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}
