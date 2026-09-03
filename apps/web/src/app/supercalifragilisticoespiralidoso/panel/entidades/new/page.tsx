'use client';

import { FormEvent, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Header, Card, Button } from '@/components/common';
import { apiFetch, getPlatformSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

export default function NewClubPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    admin_email: '',
    admin_nombre: '',
    cantidad_miembros: '',
  });

  function precioPorCantidadMiembros(cantidad: number): number {
    if (cantidad <= 50) return 15;
    if (cantidad <= 100) return 30;
    return 45;
  }

  const cantidadMiembrosNum = Number(form.cantidad_miembros);
  const precioEstimado =
    form.cantidad_miembros && cantidadMiembrosNum > 0
      ? precioPorCantidadMiembros(cantidadMiembrosNum)
      : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/platform/clubs', {
        method: 'POST',
        token: session.access_token,
        body: JSON.stringify({
          nombre: form.nombre,
          admin_email: form.admin_email,
          admin_nombre: form.admin_nombre || undefined,
          precio_usd_mes: precioPorCantidadMiembros(cantidadMiembrosNum),
        }),
      });
      router.push('/supercalifragilisticoespiralidoso/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t('newClub.title')}
        subtitle={t('newClub.subtitle')}
      />

      <div className="p-6">
        <Card className="max-w-2xl">
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              {t('newClub.clubName')}
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                minLength={2}
              />
            </label>
            <label className="text-sm">
              {t('newClub.adminEmail')}
              <input
                type="email"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                required
              />
            </label>
            <label className="text-sm">
              {t('newClub.adminName')}
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.admin_nombre}
                onChange={(e) => setForm({ ...form, admin_nombre: e.target.value })}
                minLength={2}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              {t('newClub.memberCount')}
              <input
                type="number"
                min={1}
                step="1"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.cantidad_miembros}
                onChange={(e) => setForm({ ...form, cantidad_miembros: e.target.value })}
                required
              />
              {precioEstimado !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  {t('newClub.memberCountHelp').replace('{price}', String(precioEstimado))}
                </p>
              )}
            </label>

            <div className="sm:col-span-2 flex gap-3 mt-2">
              <Button type="submit" size="md" disabled={saving}>
                {saving ? t('newClub.saving') : t('newClub.create')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => router.push('/supercalifragilisticoespiralidoso/panel')}
              >
                {t('newClub.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
