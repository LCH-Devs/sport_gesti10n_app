'use client';

import { useCallback, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Header, Card, Badge, DataTable, type Column } from '@/components/common';
import { apiFetch, getPlatformSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

type PlatformAdmin = {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
};

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<PlatformAdmin[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    setLoading(true);
    try {
      const rows = await apiFetch<PlatformAdmin[]>('/platform/admins', {
        token: session.access_token,
      });
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<PlatformAdmin>[] = [
    { key: 'nombre', header: t('dashboard.name'), sortable: true },
    { key: 'email', header: t('newClub.adminEmail'), sortable: true },
    {
      key: 'activo',
      header: t('dashboard.status'),
      render: (user) => (
        <Badge
          label={user.activo ? 'Activo' : 'Inactivo'}
          variant={user.activo ? 'success' : 'error'}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Administradores ClubApp"
        subtitle="Cuentas de Superadmin. Los socios de cada club se gestionan en el panel del club."
      />

      <div className="p-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {loading && <p className="mb-4 text-sm text-slate-500">{t('common.loading')}</p>}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Superusuarios
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{users.length}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Activos
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {users.filter((u) => u.activo).length}
            </p>
          </Card>
        </div>

        <Card>
          <DataTable
            columns={columns}
            data={users}
            getRowId={(user) => user.id}
          />
        </Card>
      </div>
    </div>
  );
}
