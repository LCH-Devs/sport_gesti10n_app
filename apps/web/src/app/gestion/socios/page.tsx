'use client';

import { apiDownload, apiFetch, apiUpload, isPlanUpgradeRequired, requireSession, type PlanUpgradeBody } from '@/lib/api';
import { PlanUpgradeModal } from '@/components/PlanUpgradeModal';
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
  categoria?: { nombre: string; monto: number } | null;
};

type ImportResult = {
  created: number;
  updated: number;
  errors: string[];
};

export default function SociosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrade, setUpgrade] = useState<PlanUpgradeBody | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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

  async function onDownloadTemplate() {
    const session = requireSession();
    if (!session) return;
    setDownloadingTemplate(true);
    setError('');
    try {
      await apiDownload('/socios/import-template', 'plantilla-socios.xlsx', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.socios.templateError'),
      );
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function onImport(file: File, aceptaUpgrade = false) {
    const session = requireSession();
    if (!session) return;
    setImporting(true);
    setError('');
    setImportResult(null);
    try {
      const result = await apiUpload<ImportResult>('/socios/import-csv', file, {
        token: session.access_token,
        clubSlug: session.club.slug,
        fields: aceptaUpgrade ? { acepta_upgrade: 'true' } : undefined,
      });
      setImportResult(result);
      setPendingFile(null);
      await load();
    } catch (err) {
      if (isPlanUpgradeRequired(err)) {
        setPendingFile(file);
        setUpgrade(err.body as unknown as PlanUpgradeBody);
        return;
      }
      setError(err instanceof Error ? err.message : t('admin.socios.importError'));
    } finally {
      setImporting(false);
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
    {
      key: 'categoria',
      header: t('admin.socios.categoria', 'Categoría'),
      render: (s) => s.categoria?.nombre || 'Socio pleno',
    },
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
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void onDownloadTemplate()}
            disabled={downloadingTemplate || importing}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {downloadingTemplate
              ? t('admin.socios.downloadingTemplate')
              : t('admin.socios.downloadTemplate')}
          </button>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={importing || downloadingTemplate}
            className="block text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              void onImport(file);
            }}
          />
        </div>
        {importing && (
          <p className="mt-2 text-sm text-slate-500">{t('admin.socios.importing')}</p>
        )}
        {importResult && (
          <div className="mt-3 text-sm">
            <p className="text-emerald-700">
              {t('admin.socios.importOk')
                .replace('{created}', String(importResult.created))
                .replace('{updated}', String(importResult.updated))}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-2 text-red-700">
                {importResult.errors.map((msg, i) => (
                  <li key={`${i}-${msg}`}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}
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
      {upgrade && (
        <PlanUpgradeModal
          data={upgrade}
          busy={importing}
          onCancel={() => {
            setUpgrade(null);
            setPendingFile(null);
          }}
          onAccept={() => {
            const file = pendingFile;
            setUpgrade(null);
            if (file) void onImport(file, true);
          }}
        />
      )}
    </div>
  );
}
