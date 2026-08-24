'use client';

import { useTranslation, type Language } from '@/lib/useTranslation';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const { lang, setLanguage } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1 rounded text-sm font-medium transition ${
          lang === 'es'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition ${
          lang === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
      >
        EN
      </button>
    </div>
  );
}
