import React, { createContext, useContext, useState, useEffect } from 'react';
import i18next from '../i18n/i18n';

export type AppLanguage = 'en' | 'fr';
export type AppTheme = 'light' | 'dark';

export interface AppContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [theme, setTheme] = useState<AppTheme>('light');

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    i18next.changeLanguage(lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'fr' : 'en';
    setLanguage(nextLang);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    // Graceful fallback if outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      theme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
};

export default AppContext;
