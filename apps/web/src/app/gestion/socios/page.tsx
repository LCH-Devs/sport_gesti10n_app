'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { DataTable, type Column, FloatingActionButton } from '@/components/common';
import { SociosFamiliasTabs } from '../_components/SociosFamiliasTabs';

type Socio = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  estado: string;
  rol: string;
};

export default function SociosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Socio[]>('/socios', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setSocios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(socio: Socio) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/socios/${socio.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const columns: Column<Socio>[] = [
    { key: 'dni', header: t('admin.socios.dni'), sortable: true },
    {
      key: 'apellido',
      header: t('admin.socios.nombre'),
      sortable: true,
      render: (s) => `${s.apellido}, ${s.nombre}`,
    },
    { key: 'email', header: t('admin.socios.email'), sortable: true },
    { key: 'estado', header: t('admin.socios.estado'), sortable: true },
    { key: 'rol', header: t('admin.socios.rol'), sortable: true },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.socios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.socios.subtitle')}
      </p>

      <div className="mt-6">
        <SociosFamiliasTabs />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 rounded-xl border bg-white p-4">
        <h3 className="font-semibold">{t('admin.socios.importCsv')}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {t('admin.socios.csvHeader')}
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="mt-3 block text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const session = requireSession();
            if (!session) return;
            const text = await file.text();
            try {
              const result = await apiFetch<{
                created: number;
                updated: number;
                errors: string[];
              }>('/socios/import-csv', {
                method: 'POST',
                token: session.access_token,
                clubSlug: session.club.slug,
                body: JSON.stringify({ csv: text }),
              });
              setError(
                result.errors.length
                  ? `OK ${result.created} altas, ${result.updated} updates. Errores: ${result.errors.slice(0, 3).join('; ')}`
                  : '',
              );
              if (!result.errors.length) {
                alert(
                  `Importados: ${result.created} nuevos, ${result.updated} actualizados`,
                );
              }
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error CSV');
            }
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={socios}
          getRowId={(s) => s.id}
          loading={loading}
          onEdit={(s) => router.push(`/gestion/socios/nuevo?id=${s.id}`)}
          onDelete={onDelete}
          deleteConfirmMessage={(s) => `${t('admin.socios.eliminar')} ${s.nombre} ${s.apellido}?`}
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/gestion/socios/nuevo')}
        aria-label={t('admin.socios.createSocio')}
        title={t('admin.socios.createSocio')}
      />
    </div>
  );
}
