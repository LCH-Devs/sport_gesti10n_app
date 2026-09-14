'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';

const MP_SDK_URL = 'https://sdk.mercadopago.com/js/v2';
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '';

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, opts?: { locale?: string }) => {
      cardForm: (opts: Record<string, unknown>) => { getCardFormData: () => Record<string, string> };
    };
  }
}

type Props = {
  token: string;
  clubSlug: string;
  email: string;
  verified: boolean;
  onVerified: () => void;
  /** Nodo (fuera del <form> principal del wizard) donde se monta el <form> de MercadoPago. */
  portalTarget: Element | null;
};

export function VerificarTarjetaCard({
  token,
  clubSlug,
  email,
  verified,
  onVerified,
  portalTarget,
}: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [skipped, setSkipped] = useState(false);
  const cardFormRef = useRef<{ getCardFormData: () => Record<string, string> } | null>(null);

  useEffect(() => {
    if (!MP_PUBLIC_KEY || verified) return;
    if (window.MercadoPago) {
      setSdkReady(true);
      return;
    }
    const existing = document.querySelector(`script[src="${MP_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => setSdkReady(true));
      return;
    }
    const script = document.createElement('script');
    script.src = MP_SDK_URL;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, [verified]);

  useEffect(() => {
    if (!sdkReady || !MP_PUBLIC_KEY || verified || cardFormRef.current || !window.MercadoPago) {
      return;
    }
    const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' });
    cardFormRef.current = mp.cardForm({
      amount: '1.00',
      iframe: true,
      form: {
        id: 'form-verificar-tarjeta',
        cardholderName: { id: 'vt-cardholderName' },
        cardholderEmail: { id: 'vt-cardholderEmail' },
        cardNumber: { id: 'vt-cardNumber' },
        expirationDate: { id: 'vt-expirationDate' },
        securityCode: { id: 'vt-securityCode' },
        installments: { id: 'vt-installments' },
        identificationType: { id: 'vt-identificationType' },
        identificationNumber: { id: 'vt-identificationNumber' },
        issuer: { id: 'vt-issuer' },
      },
      callbacks: {
        onFormMounted: (error: unknown) => {
          if (error) setErrorMsg('No se pudo cargar el formulario de tarjeta.');
        },
        onSubmit: async (event: Event) => {
          event.preventDefault();
          setSubmitting(true);
          setErrorMsg('');
          try {
            const data = cardFormRef.current!.getCardFormData();
            await apiFetch('/clubs/me/verificar-tarjeta', {
              method: 'POST',
              token,
              clubSlug,
              body: JSON.stringify({
                token: data.token,
                payment_method_id: data.paymentMethodId,
                issuer_id: data.issuerId || undefined,
                payer_email: data.cardholderEmail,
                identification_type: data.identificationType,
                identification_number: data.identificationNumber,
              }),
            });
            onVerified();
          } catch (err) {
            setErrorMsg(
              err instanceof Error ? err.message : 'No se pudo verificar la tarjeta',
            );
          } finally {
            setSubmitting(false);
          }
        },
      },
    });
  }, [sdkReady, verified, token, clubSlug, onVerified]);

  async function simular() {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await apiFetch('/clubs/me/verificar-tarjeta', {
        method: 'POST',
        token,
        clubSlug,
        body: JSON.stringify({
          token: 'TEST-0000000000000000000000000000',
          payment_method_id: 'visa',
          payer_email: email || 'test@test.com',
        }),
      });
      onVerified();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo verificar la tarjeta');
    } finally {
      setSubmitting(false);
    }
  }

  if (verified) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        ✓ Tarjeta verificada: se cobró $1 y se reembolsó automáticamente.
      </div>
    );
  }

  if (skipped) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Verificación omitida. Podés hacerla más tarde desde Configuración.
        <button
          type="button"
          className="text-sm font-medium text-[var(--primary)] underline"
          onClick={() => setSkipped(false)}
        >
          Verificar ahora
        </button>
      </div>
    );
  }

  const cardFormMarkup = (
    <form id="form-verificar-tarjeta" className="mt-3 grid gap-2 sm:grid-cols-2">
      <input
        id="vt-cardholderName"
        className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
        placeholder="Nombre en la tarjeta"
      />
      <input
        id="vt-cardholderEmail"
        className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
        placeholder="Email"
        defaultValue={email}
      />
      <div id="vt-cardNumber" className="h-[38px] rounded-lg border px-3 py-2 text-sm sm:col-span-2" />
      <div id="vt-expirationDate" className="h-[38px] rounded-lg border px-3 py-2 text-sm" />
      <div id="vt-securityCode" className="h-[38px] rounded-lg border px-3 py-2 text-sm" />
      <select id="vt-issuer" className="select-field rounded-lg border px-3 py-2 text-sm" />
      <select id="vt-installments" className="select-field rounded-lg border px-3 py-2 text-sm" />
      <select id="vt-identificationType" className="select-field rounded-lg border px-3 py-2 text-sm" />
      <input
        id="vt-identificationNumber"
        className="rounded-lg border px-3 py-2 text-sm"
        placeholder="DNI"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
      >
        {submitting ? 'Verificando…' : 'Verificar tarjeta ($1)'}
      </button>
    </form>
  );

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-800">Verificar tarjeta (opcional)</p>
      <p className="mt-1 text-xs text-slate-500">
        Te cobramos $1 para confirmar que la tarjeta es real y te lo devolvemos al
        instante. Podés omitir este paso y hacerlo después desde Configuración.
      </p>

      {!MP_PUBLIC_KEY ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-amber-700">
            Modo prueba: no hay clave pública de MercadoPago configurada.
          </p>
          <button
            type="button"
            onClick={simular}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            {submitting ? 'Verificando…' : 'Simular verificación'}
          </button>
        </div>
      ) : portalTarget ? (
        createPortal(cardFormMarkup, portalTarget)
      ) : (
        <p className="mt-3 text-xs text-slate-400">Cargando formulario…</p>
      )}

      {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}

      <button
        type="button"
        className="mt-3 text-xs text-slate-500 underline"
        onClick={() => setSkipped(true)}
      >
        Omitir por ahora
      </button>
    </div>
  );
}
