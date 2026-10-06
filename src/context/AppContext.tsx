import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from '../i18n/i18n';

export type AppLanguage = 'en' | 'hi' | 'fr';
export type AppTheme = 'light' | 'dark';

const LANGUAGE_STORAGE_KEY = 'user_selected_language';

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

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && (saved === 'en' || saved === 'hi' || saved === 'fr')) {
          setLanguageState(saved as AppLanguage);
          i18next.changeLanguage(saved);
        }
      } catch (err) {
        console.warn('Failed to load language from storage', err);
      }
    })();
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    i18next.changeLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch(() => {});
  };

  const toggleLanguage = () => {
    const nextLang: AppLanguage = language === 'en' ? 'fr' : 'en';
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
