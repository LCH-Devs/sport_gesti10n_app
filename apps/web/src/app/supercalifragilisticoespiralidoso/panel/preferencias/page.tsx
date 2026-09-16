'use client';

import { getPlatformSession } from '@/lib/api';
import { Header } from '@/components/common';
import { useLanguageContext } from '@/lib/LanguageContext';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { useTranslation } from '@/lib/useTranslation';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import type { TimeFormat } from '@/lib/datetime';

const NOTIF_KEY = 'clubapp_platform_notif_prefs';

type NotifPrefs = {
  email: boolean;
  app: boolean;
};

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === 'undefined') return { email: true, app: true };
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) return { email: true, app: true };
    return JSON.parse(raw) as NotifPrefs;
  } catch {
    return { email: true, app: true };
  }
}

export default function PlatformPreferenciasPage() {
  const { t } = useTranslation();
  const { lang, setLanguage, mounted } = useLanguageContext();
  const { timeFormat, setTimeFormat } = useDateTimeFormat();
  const [allowed, setAllowed] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    email: true,
    app: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!getPlatformSession()) {
      notFound();
      return;
    }
    setAllowed(true);
    setNotifPrefs(loadNotifPrefs());
  }, []);

  function updateNotif(key: keyof NotifPrefs, value: boolean) {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Preferencias" subtitle="Idioma, formato de hora y notificaciones de tu cuenta." />
      <div className="p-6">
        {saved && <p className="mb-4 text-sm text-green-700">Preferencias guardadas.</p>}

        <div className="grid gap-6 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Idioma</p>
            <div className="mt-2 flex gap-2">
              {(['es', 'en'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={!mounted}
                  onClick={() => setLanguage(option)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    lang === option
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option === 'es' ? 'Español' : 'English'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">{t('config.formatoHora')}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t('config.formatoHoraHint')}</p>
            <div className="mt-2 flex gap-2">
              {(['24h', '12h'] as TimeFormat[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setTimeFormat(option);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 1500);
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    timeFormat === option
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option === '24h' ? t('config.formato24h') : t('config.formato12h')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Notificaciones</p>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifPrefs.email}
                onChange={(e) => updateNotif('email', e.target.checked)}
              />
              Recibir notificaciones por email
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifPrefs.app}
                onChange={(e) => updateNotif('app', e.target.checked)}
              />
              Recibir notificaciones en la app
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
