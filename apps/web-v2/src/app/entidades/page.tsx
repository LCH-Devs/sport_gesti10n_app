'use client';

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Card, Badge, Button } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';
import { apiFetch, getPlatformSession, mediaUrl } from '@/lib/api';

type ClubRow = {
  id: number;
  slug: string;
  nombre: string;
  logo_url: string | null;
  activo: boolean;
  plan: string;
  precio_usd_mes: number;
  cuota_monto: number;
  onboarding_completo?: boolean;
  _count: { admins: number; socios: number };
  admins: Array<{ id: number; email: string; nombre: string }>;
};

type CreateClubResponse = {
  club: { id: number; slug: string; nombre: string; precio_usd_mes: number };
  admin: { email: string; nombre: string };
  credentials_once: { email: string; password: string; login_url: string };
};

export default function ClubsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    admin_email: '',
    admin_nombre: '',
    precio_usd_mes: '49',
  });
  const [created, setCreated] = useState<CreateClubResponse | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      router.push('/acceso');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<ClubRow[]>('/platform/clubs', {
        token: session.access_token,
      });
      setClubs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = getPlatformSession();
    if (!session) return;
    const precio = Number(form.precio_usd_mes);
    if (Number.isNaN(precio) || precio < 0) {
      setError(t('messages.errorCreating'));
      return;
    }
    setSaving(true);
    setError('');
    setCreated(null);
    try {
      const result = await apiFetch<CreateClubResponse>('/platform/clubs', {
        method: 'POST',
        token: session.access_token,
        body: JSON.stringify({
          nombre: form.nombre,
          admin_email: form.admin_email,
          admin_nombre: form.admin_nombre || undefined,
          precio_usd_mes: precio,
        }),
      });
      setCreated(result);
      setForm({ nombre: '', admin_email: '', admin_nombre: '', precio_usd_mes: '49' });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreating'));
    } finally {
      setSaving(false);
    }
  }

  function onManageClub(clubId: number) {
    router.push(`/entidades/${clubId}`);
  }

  const filteredClubs = clubs.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title={t('clubs.title')} subtitle={t('clubs.subtitle')}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('clubs.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-md border border-slate-300 w-80"
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowForm((v) => !v)}
          >
            + {t('clubs.addClub')}
          </Button>
        </div>
      </Header>

      <div className="p-6">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {created && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <p className="font-semibold text-green-900">
              {t('newClub.title')}: {created.club.nombre}
            </p>
            <div className="mt-2 grid gap-1 text-sm text-green-950 sm:grid-cols-2">
              <p>
                {t('newClub.link')}:{' '}
                <a
                  className="font-medium underline"
                  href={created.credentials_once.login_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {created.credentials_once.login_url}
                </a>
              </p>
              <p>
                {t('newClub.adminEmail')}:{' '}
                <strong>{created.credentials_once.email}</strong>
              </p>
              <p>
                {t('newClub.password')}:{' '}
                <strong>{created.credentials_once.password}</strong>
              </p>
            </div>
          </Card>
        )}

        {showForm && (
          <form
            onSubmit={onCreate}
            className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 mb-6"
          >
            <div className="sm:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('newClub.title')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('newClub.subtitle')}
              </p>
            </div>
            <label className="text-sm font-medium text-slate-700">
              {t('newClub.clubName')}
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t('newClub.adminEmail')}
              <input
                type="email"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t('newClub.adminName')}
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={form.admin_nombre}
                onChange={(e) => setForm({ ...form, admin_nombre: e.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t('newClub.monthlyPrice')}
              <input
                type="number"
                min="0"
                step="0.01"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={form.precio_usd_mes}
                onChange={(e) =>
                  setForm({ ...form, precio_usd_mes: e.target.value })
                }
                required
              />
            </label>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? t('newClub.saving') : t('newClub.create')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                {t('newClub.cancel')}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500">{t('common.loading')}</p>
        ) : filteredClubs.length === 0 ? (
          <p className="text-slate-500">{t('messages.noData')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClubs.map((club) => (
              <Card key={club.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center text-2xl overflow-hidden">
                      {club.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(club.logo_url)}
                          alt={club.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        '⚽'
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {club.nombre}
                      </h3>
                      <Badge
                        label={club.activo ? t('clubs.active') : t('clubs.inactive')}
                        variant={club.activo ? 'success' : 'error'}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600 mb-4">
                  <p>
                    USD {club.precio_usd_mes} {t('clubs.perMonth')}
                  </p>
                  <p>
                    {club._count.socios} {t('clubs.membersWord')} ·{' '}
                    {club._count.admins} {t('clubs.adminsWord')}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onManageClub(club.id)}
                >
                  {t('clubs.manageClub')}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Map Placeholder */}
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('clubs.mapTitle')}</h2>
          <div className="h-96 bg-slate-200 rounded-md flex items-center justify-center text-slate-600">
            🗺️ {t('clubs.mapComingSoon')}
          </div>
        </Card>
      </div>
    </div>
  );
}
