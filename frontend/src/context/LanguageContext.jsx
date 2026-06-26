import React, { createContext, useCallback } from 'react';
import { translations } from '../utils/translations';
import { citizenTranslations } from '../utils/citizenTranslations';

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const language = 'en';
  const isRTL = false;

  const changeLanguage = useCallback(() => {}, []);
  const setLanguage = changeLanguage;

  const t = useCallback((key) => {
    return (
      citizenTranslations['en']?.[key] ??
      translations['en']?.[key] ??
      key
    );
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, changeLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

