import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, SUPPORTED_LANGUAGES, getNestedTranslation } from '../i18n';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'portal_language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
        document.documentElement.lang = newLang;
      } catch (err) {
        console.warn('[LanguageContext] Failed to persist language to localStorage:', err);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Primary translation function
  const t = useCallback(
    (keyPath, fallback = '') => {
      const dict = translations[language] || translations.en;
      const translated = getNestedTranslation(dict, keyPath);
      if (translated !== null && translated !== undefined) {
        return translated;
      }

      // Fallback to English
      if (language !== 'en') {
        const enTranslated = getNestedTranslation(translations.en, keyPath);
        if (enTranslated !== null && enTranslated !== undefined) {
          return enTranslated;
        }
      }

      return fallback || keyPath;
    },
    [language]
  );

  // Helper for Department display names
  const tDept = useCallback(
    (deptName) => {
      if (!deptName) return t('departments.Unassigned', 'Unassigned / Pending Review');
      return t(`departments.${deptName}`, deptName);
    },
    [t]
  );

  // Helper for Status display names
  const tStatus = useCallback(
    (statusValue) => {
      if (!statusValue) return t('status.submitted', 'Submitted');
      const normalized = String(statusValue).toLowerCase();
      return t(`status.${normalized}`, statusValue);
    },
    [t]
  );

  // Helper for Priority display names
  const tPriority = useCallback(
    (priorityValue) => {
      if (!priorityValue) return t('priority.medium', 'Medium');
      const normalized = String(priorityValue).toLowerCase();
      return t(`priority.${normalized}`, priorityValue);
    },
    [t]
  );

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      tDept,
      tStatus,
      tPriority,
      languages: SUPPORTED_LANGUAGES,
      currentLanguage,
    }),
    [language, setLanguage, t, tDept, tStatus, tPriority, currentLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
