'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { DataTable, FloatingActionButton, type Column } from '@/components/common';

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
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiFetch<AdminUser[]>('/admins', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setAdmins(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(admin: AdminUser) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/admins/${admin.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  const columns: Column<AdminUser>[] = [
    { key: 'nombre', header: t('dashboard.name'), sortable: true },
    { key: 'email', header: t('dashboard.email'), sortable: true },
    { key: 'rol', header: t('dashboard.role') },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.usuarios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.usuarios.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={admins}
          getRowId={(a) => a.id}
          loading={loading}
          onDelete={onDelete}
          deleteConfirmMessage={t('admin.usuarios.confirmDelete')}
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/gestion/usuarios/nuevo')}
        aria-label={t('admin.usuarios.createUsuario')}
        title={t('admin.usuarios.createUsuario')}
      />
    </div>
  );
}
