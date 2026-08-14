'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch, getPlatformSession } from '@/lib/api';

type ClubRow = {
  id: number;
  slug: string;
  nombre: string;
  color_primario: string;
  plan: string;
  precio_usd_mes: number;
  cuota_monto: number;
  activo: boolean;
  onboarding_completo?: boolean;
  logo_url: string | null;
  _count: { admins: number; socios: number };
  admins: Array<{ id: number; email: string; nombre: string; rol: string }>;
};

type CreateClubResponse = {
  club: { id: number; slug: string; nombre: string; precio_usd_mes: number };
  admin: { email: string; nombre: string };
  credentials_once: { email: string; password: string; login_url: string };
  mail: {
    subject: string;
    body: string;
    to: string;
    sent?: boolean;
    stub?: boolean;
    error?: string;
  };
};

function money(n: number) {
  return `USD ${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function PlatformClubsPage() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    admin_email: '',
    admin_nombre: '',
    precio_usd_mes: '49',
  });
  const [created, setCreated] = useState<CreateClubResponse | null>(null);
  const [editingPrice, setEditingPrice] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<ClubRow[]>('/platform/clubs', {
        token: session.access_token,
      });
      setClubs(data);
      setEditingPrice(
        Object.fromEntries(data.map((c) => [c.id, String(c.precio_usd_mes)])),
      );
      window.dispatchEvent(new Event('platform-clubs-changed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = getPlatformSession();
    if (!session) return;
    setError('');
    setCreated(null);
    const precio = Number(form.precio_usd_mes);
    if (Number.isNaN(precio) || precio < 0) {
      setError('El precio USD/mes tiene que ser un número ≥ 0');
      return;
    }
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
      setForm({
        nombre: '',
        admin_email: '',
        admin_nombre: '',
        precio_usd_mes: '49',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  async function toggleActivo(club: ClubRow) {
    const session = getPlatformSession();
    if (!session) return;
    try {
      await apiFetch(`/platform/clubs/${club.id}`, {
        method: 'PATCH',
        token: session.access_token,
        body: JSON.stringify({ activo: !club.activo }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  }

  async function savePrice(club: ClubRow) {
    const session = getPlatformSession();
    if (!session) return;
    const precio = Number(editingPrice[club.id]);
    if (Number.isNaN(precio) || precio < 0) {
      setError('El precio USD/mes tiene que ser un número ≥ 0');
      return;
    }
    try {
      await apiFetch(`/platform/clubs/${club.id}`, {
        method: 'PATCH',
        token: session.access_token,
        body: JSON.stringify({ precio_usd_mes: precio }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  const activos = clubs.filter((c) => c.activo);
  const mrr = activos.reduce((sum, c) => sum + (c.precio_usd_mes || 0), 0);
  const pendientes = clubs.filter((c) => !c.onboarding_completo).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Clubes activos
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {activos.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {clubs.length} en total
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Recurrente
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {money(mrr)}
          </p>
          <p className="mt-1 text-sm text-slate-500">USD / mes</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Onboarding
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {pendientes}
          </p>
          <p className="mt-1 text-sm text-slate-500">pendientes de completar</p>
        </div>
      </div>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {created && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
          <p className="font-semibold">
            {created.mail.sent
              ? `Club creado — mail enviado a ${created.mail.to}`
              : 'Club creado — el mail no se envió (SMTP). Copiá y mandalo a mano'}
          </p>
          {created.mail.error && (
            <p className="mt-1 text-xs text-amber-800">{created.mail.error}</p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p>
              Link:{' '}
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
              Usuario: <strong>{created.credentials_once.email}</strong>
            </p>
            <p>
              Password temporal:{' '}
              <strong>{created.credentials_once.password}</strong>
            </p>
            <p>
              Precio:{' '}
              <strong>{money(created.club.precio_usd_mes)} / mes</strong>
            </p>
          </div>
          <button
            type="button"
            className="mt-4 rounded-lg border border-emerald-400 bg-white px-3 py-1.5 text-xs font-medium"
            onClick={() =>
              void copyText(`${created.mail.subject}\n\n${created.mail.body}`)
            }
          >
            Copiar mail
          </button>
          <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-700">
            {created.mail.body}
          </pre>
        </div>
      )}

      <form
        onSubmit={onCreate}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Nuevo club</h2>
          <p className="mt-1 text-sm text-slate-500">
            Se crea el admin inicial, el slug y una contraseña temporal.
          </p>
        </div>
        <label className="text-sm font-medium text-slate-700">
          Nombre del club
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email del admin
          <input
            type="email"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={form.admin_email}
            onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Nombre del admin
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={form.admin_nombre}
            onChange={(e) => setForm({ ...form, admin_nombre: e.target.value })}
            placeholder="Opcional"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Precio ClubApp (USD / mes)
          <input
            type="number"
            min="0"
            step="0.01"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={form.precio_usd_mes}
            onChange={(e) =>
              setForm({ ...form, precio_usd_mes: e.target.value })
            }
            required
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Crear club y generar acceso
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-slate-500">Cargando…</p>
        ) : clubs.length === 0 ? (
          <p className="p-6 text-slate-500">Todavía no hay clubes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Club</th>
                  <th className="px-5 py-3">Link</th>
                  <th className="px-5 py-3">USD / mes</th>
                  <th className="px-5 py-3">Onboarding</th>
                  <th className="px-5 py-3">Admins</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {clubs.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: c.color_primario }}
                        />
                        <div>
                          <p className="font-medium text-slate-900">{c.nombre}</p>
                          <p className="text-xs text-slate-400">
                            {c._count.socios} socios
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        className="font-mono text-xs text-sky-700 hover:underline"
                        href={`/login/${c.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        /login/{c.slug}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-sky-400"
                          value={editingPrice[c.id] ?? ''}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              [c.id]: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          onClick={() => void savePrice(c)}
                        >
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {c.onboarding_completo ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Completo
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {c._count.admins}
                      </p>
                      <p className="max-w-[180px] truncate text-xs text-slate-400">
                        {c.admins.map((a) => a.email).join(', ')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {c.activo ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          Suspendido
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => void toggleActivo(c)}
                      >
                        {c.activo ? 'Suspender' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
