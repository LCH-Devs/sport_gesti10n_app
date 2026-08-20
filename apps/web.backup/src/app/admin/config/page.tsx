'use client';

import { apiFetch, getSession, saveSession, applyClubTheme } from '@/lib/api';
import { ClubColorFields } from '@/components/ClubColorFields';
import { ClubLogoField } from '@/components/ClubLogoField';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type ClubConfig = {
  id: number;
  slug: string;
  nombre: string;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string | null;
  color_terciario: string | null;
  cuota_monto: number;
  regla_moroso_cuotas: number;
  bloquear_reservas: boolean;
  bloquear_entrada: boolean;
  cumples_auto: boolean;
  max_reservas_activas: number;
  cancelar_reserva_horas: number;
};

export default function ConfigPage() {
  const [form, setForm] = useState<ClubConfig | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<ClubConfig>('/clubs/me', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session || !form) return;
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const updated = await apiFetch<ClubConfig>('/clubs/me', {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          nombre: form.nombre,
          logo_url: form.logo_url || '',
          color_primario: form.color_primario,
          color_secundario: form.color_secundario || null,
          color_terciario: form.color_terciario || null,
          cuota_monto: Number(form.cuota_monto),
          regla_moroso_cuotas: Number(form.regla_moroso_cuotas),
          bloquear_reservas: form.bloquear_reservas,
          bloquear_entrada: form.bloquear_entrada,
          cumples_auto: form.cumples_auto,
          max_reservas_activas: Number(form.max_reservas_activas),
          cancelar_reserva_horas: Number(form.cancelar_reserva_horas),
        }),
      });
      setForm(updated);
      applyClubTheme(updated);
      saveSession({
        ...session,
        club: {
          ...session.club,
          nombre: updated.nombre,
          color_primario: updated.color_primario,
          color_secundario: updated.color_secundario,
          color_terciario: updated.color_terciario,
          logo_url: updated.logo_url,
          cuota_monto: updated.cuota_monto,
        },
      });
      setMsg('Configuración guardada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-4 text-slate-500">Cargando…</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Configuración</h2>
      <p className="mt-1 text-sm text-slate-600">
        Datos y reglas del club (solo tu tenant).
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}

      <form
        onSubmit={onSave}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Nombre
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => f && { ...f, nombre: e.target.value })}
            required
          />
        </label>
        <ClubColorFields
          primario={form.color_primario}
          secundario={form.color_secundario}
          terciario={form.color_terciario}
          livePreview
          onChange={(next) =>
            setForm((f) =>
              f
                ? {
                    ...f,
                    color_primario: next.color_primario,
                    color_secundario: next.color_secundario,
                    color_terciario: next.color_terciario,
                  }
                : f,
            )
          }
        />
        <ClubLogoField
          value={form.logo_url || ''}
          onChange={(logo_url) => setForm((f) => f && { ...f, logo_url })}
          onError={setError}
        />
        <label className="text-sm">
          Cuota monto
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.cuota_monto}
            onChange={(e) =>
              setForm((f) => f && { ...f, cuota_monto: Number(e.target.value) })
            }
            required
          />
        </label>
        <label className="text-sm">
          Regla moroso (cuotas)
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.regla_moroso_cuotas}
            onChange={(e) =>
              setForm(
                (f) =>
                  f && { ...f, regla_moroso_cuotas: Number(e.target.value) },
              )
            }
            required
          />
        </label>
        <label className="text-sm">
          Máx. reservas activas
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.max_reservas_activas}
            onChange={(e) =>
              setForm(
                (f) =>
                  f && { ...f, max_reservas_activas: Number(e.target.value) },
              )
            }
            required
          />
        </label>
        <label className="text-sm">
          Cancelar reserva (horas)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.cancelar_reserva_horas}
            onChange={(e) =>
              setForm(
                (f) =>
                  f && {
                    ...f,
                    cancelar_reserva_horas: Number(e.target.value),
                  },
              )
            }
            required
          />
        </label>

        {(
          [
            ['bloquear_reservas', 'Bloquear reservas si debe'],
            ['bloquear_entrada', 'Bloquear entrada si debe'],
            ['cumples_auto', 'Cumpleaños automáticos'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) =>
                setForm((f) => f && { ...f, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
