'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedLang = (localStorage.getItem('lang') || 'es') as Language;
    setLang(storedLang);
    setMounted(true);
  }, []);

  const setLanguage = (newLang: Language) => {
    localStorage.setItem('lang', newLang);
    setLang(newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
}
