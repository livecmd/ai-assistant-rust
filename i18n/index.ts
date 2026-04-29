/**
 * Internationalization (i18n) System
 * Supports Chinese (zh-CN) and English (en-US)
 */

import { translations, TranslationKey } from './translations';

export type Language = 'zh-CN' | 'en-US';

const LANGUAGE_KEY = 'app-language';

// Get saved language or use browser language
export const getInitialLanguage = (): Language => {
  // Check localStorage first
  const saved = localStorage.getItem(LANGUAGE_KEY) as Language | null;
  if (saved && (saved === 'zh-CN' || saved === 'en-US')) {
    return saved;
  }
  
  // Check browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
};

// Save language preference
export const saveLanguage = (lang: Language): void => {
  localStorage.setItem(LANGUAGE_KEY, lang);
};

// Get translation function for a specific language
export const getTranslation = (lang: Language) => {
  return (key: TranslationKey, fallback?: string): string => {
    const value = translations[lang][key];
    return value || fallback || key;
  };
};

// Create a React hook for i18n
export const createI18nHook = () => {
  let currentLanguage: Language = getInitialLanguage();
  const listeners: Set<() => void> = new Set();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const setLanguage = (lang: Language) => {
    currentLanguage = lang;
    saveLanguage(lang);
    listeners.forEach(listener => listener());
  };

  const getLanguage = () => currentLanguage;

  return {
    subscribe,
    setLanguage,
    getLanguage,
    getTranslation: () => getTranslation(currentLanguage)
  };
};

export const i18n = createI18nHook();
