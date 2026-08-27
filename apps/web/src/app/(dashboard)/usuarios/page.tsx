'use client';

import { apiFetch, getSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import {
  DataTable,
  FloatingActionButton,
  type Column,
} from '@/components/common';

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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<AdminUser[]>('/admins', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(user: AdminUser) {
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch(`/admins/${user.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const columns: Column<AdminUser>[] = [
    { key: 'nombre', header: t('dashboard.name'), sortable: true },
    { key: 'email', header: t('dashboard.email'), sortable: true },
    { key: 'rol', header: t('dashboard.role'), sortable: true },
  ];

  return (
    <div>
      <div className="border-b border-slate-200 pb-2">
        <h2 className="text-2xl font-bold">{t('admin.usuarios.title')}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {t('admin.usuarios.subtitle')}
        </p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={admins}
          getRowId={(user) => user.id}
          loading={loading}
          onDelete={onDelete}
          deleteConfirmMessage={(user) =>
            `${t('admin.socios.eliminar')} ${user.nombre}?`
          }
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/usuarios/nuevo')}
        aria-label={t('admin.usuarios.createUsuario')}
      />
    </div>
  );
}
