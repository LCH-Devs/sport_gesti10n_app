'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FloatingActionButton } from '@/components/common';

type AdminUser = {
  id: number;
  email: string;
  nombre: string;
  rol: string;
};

export default function UsuariosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    try {
      const data = await apiFetch<AdminUser[]>('/admins', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setAdmins(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: number) {
    const session = requireSession();
    if (!session || !confirm('¿Eliminar usuario?')) return;
    try {
      await apiFetch(`/admins/${id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.usuarios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.usuarios.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">{t('dashboard.name')}</th>
              <th className="px-4 py-3">{t('dashboard.email')}</th>
              <th className="px-4 py-3">{t('dashboard.role')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-3">{a.nombre}</td>
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3">{a.rol}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => void onDelete(a.id)}
                  >
                    {t('admin.socios.eliminar')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FloatingActionButton
        onClick={() => router.push('/gestion/usuarios/nuevo')}
        aria-label={t('admin.usuarios.createUsuario')}
        title={t('admin.usuarios.createUsuario')}
      />
    </div>
  );
}
