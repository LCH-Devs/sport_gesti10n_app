'use client';

import { useCallback } from 'react';
import es from '@/lib/translations/es.json';
import en from '@/lib/translations/en.json';
import { useLanguageContext } from '@/lib/LanguageContext';

export type Language = 'es' | 'en';

const translations = { es, en };

export function useTranslation() {
  const { lang, setLanguage, mounted } = useLanguageContext();

  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      const keys = key.split('.');
      let value: any = translations[lang];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return defaultValue || key;
        }
      }

      return typeof value === 'string' ? value : defaultValue || key;
    },
    [lang],
  );

  return { t, lang, setLanguage, mounted };
}
