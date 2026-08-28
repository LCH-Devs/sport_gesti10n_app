'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useChrome } from '@/lib/ChromeContext';

export default function NotFound() {
  const { setHideChrome } = useChrome();

  useEffect(() => {
    setHideChrome(true);
    return () => setHideChrome(false);
  }, [setHideChrome]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
        <span className="text-2xl font-bold text-white">A</span>
      </div>
      <h1 className="text-6xl font-bold text-slate-900">404</h1>
      <p className="mt-4 text-lg font-medium text-slate-700">Página no encontrada</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        El enlace al que intentaste acceder no existe o fue movido.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
