import { useState, useEffect } from 'react';
import { i18n, Language } from '../i18n';
import { TranslationKey } from '../i18n/translations';

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>(i18n.getLanguage());

  useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      setLanguage(i18n.getLanguage());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const t = (key: TranslationKey, fallback?: string): string => {
    return i18n.getTranslation()(key, fallback);
  };

  return { t, language };
};
