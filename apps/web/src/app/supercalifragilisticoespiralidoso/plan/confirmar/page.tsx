'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

function ConfirmarPlanInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando el plan…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Falta el enlace de confirmación.');
      return;
    }
    void apiFetch<{ plan: string; pendiente: { aplica_desde: string } | null }>(
      `/public/plan/confirmar?token=${encodeURIComponent(token)}`,
    )
      .then((uso) => {
        setStatus('ok');
        setMessage(
          uso.pendiente?.aplica_desde
            ? `Listo. El nuevo precio aplica desde el ${uso.pendiente.aplica_desde}. Este mes no cambia.`
            : 'Listo. El plan quedó confirmado.',
        );
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'No se pudo confirmar');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md rounded-2xl bg-white p-6 shadow-sm border">
        <h1 className="text-xl font-semibold text-slate-900">
          Confirmación de plan
        </h1>
        <p
          className={`mt-3 text-sm ${status === 'error' ? 'text-red-600' : 'text-slate-600'}`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default function ConfirmarPlanPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Cargando…</p>}>
      <ConfirmarPlanInner />
    </Suspense>
  );
}
