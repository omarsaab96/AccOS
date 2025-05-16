import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from 'i18next';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialLanguage = (): Language => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'en' || savedLanguage === 'ar') {
      return savedLanguage;
    }
    return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove old language classes and add the current one
    // root.classList.remove('en', 'ar');
    // root.classList.add(language);

    // Set HTML lang attribute for accessibility/SEO
    root.lang = language;

    // Set dir attribute for RTL support if Arabic
    root.dir = language === 'ar' ? 'rtl' : 'ltr';

    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
