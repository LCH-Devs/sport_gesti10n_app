"use client";

import { apiFetch, getSession } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/useTranslation";
import {
  DataTable,
  FloatingActionButton,
  type Column,
} from "@/components/common";

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

type SocioMini = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
};

type Familia = {
  id: number;
  nombre: string;
  titular_id: number;
  titular: SocioMini;
  socios: SocioMini[];
};

export default function SociosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'socios' | 'familias'>(() => {
    const paramTab = searchParams.get('tab');
    return paramTab === 'familias' ? 'familias' : 'socios';
  });
  const [socios, setSocios] = useState<Socio[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [soc, fam] = await Promise.all([
        apiFetch<Socio[]>("/socios", {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Familia[]>("/familias", {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setSocios(soc);
      setFamilias(fam);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onStartEdit(socio: Socio) {
    router.push(`/socios/nuevo?id=${socio.id}`);
  }

  async function onDelete(socio: Socio) {
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch(`/socios/${socio.id}`, {
        method: "DELETE",
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const session = getSession();
    if (!session) return;
    const text = await file.text();
    try {
      const result = await apiFetch<{
        created: number;
        updated: number;
        errors: string[];
      }>("/socios/import-csv", {
        method: "POST",
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({ csv: text }),
      });
      setError(
        result.errors.length
          ? `OK ${result.created} altas, ${result.updated} updates. Errores: ${result.errors.slice(0, 3).join("; ")}`
          : "",
      );
      if (!result.errors.length) {
        alert(
          `Importados: ${result.created} nuevos, ${result.updated} actualizados`,
        );
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error CSV");
    }
    e.target.value = "";
  }

  function openFileDialog() {
    fileInputRef.current?.click();
  }

  const columns: Column<Socio>[] = [
    { key: "dni", header: t("admin.socios.dni"), sortable: true },
    {
      key: "apellido",
      header: t("admin.socios.nombre"),
      sortable: true,
      render: (s) => `${s.apellido}, ${s.nombre}`,
    },
    { key: "email", header: t("admin.socios.email"), sortable: true },
    { key: "estado", header: t("admin.socios.estado"), sortable: true },
    { key: "rol", header: t("admin.socios.rol"), sortable: true },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">{t("admin.socios.title")}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t("admin.socios.subtitle")}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Tab Toggle */}
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('socios')}
          className={`px-4 py-2 font-semibold transition ${
            tab === 'socios'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t("admin.socios.title")}
        </button>
        <button
          type="button"
          onClick={() => setTab('familias')}
          className={`px-4 py-2 font-semibold transition ${
            tab === 'familias'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t("admin.familias.title")}
        </button>
      </div>

      {/* Socios Tab */}
      {tab === 'socios' && (
        <div className="mt-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={openFileDialog}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              title={t("admin.socios.csvHeader")}
            >
              {t("admin.socios.importCsv")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvImport}
            />
          </div>
          <DataTable
            columns={columns}
            data={socios}
            getRowId={(s) => s.id}
            loading={loading}
            onEdit={onStartEdit}
            onDelete={onDelete}
            deleteConfirmMessage={(s) =>
              `${t("admin.socios.eliminar")} ${s.nombre} ${s.apellido}?`
            }
          />
          <FloatingActionButton
            onClick={() => router.push("/socios/nuevo")}
            aria-label={t("admin.socios.addSocio", "Agregar Socio")}
          />
        </div>
      )}

      {/* Familias Tab */}
      {tab === 'familias' && (
        <div className="mt-8">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            {loading ? (
              <p className="p-4 text-slate-500">{t("common.loading")}</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">{t("admin.familias.nombre")}</th>
                    <th className="px-4 py-3">{t("admin.familias.titular")}</th>
                    <th className="px-4 py-3">{t("admin.familias.miembros")}</th>
                  </tr>
                </thead>
                <tbody>
                  {familias.map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{f.nombre}</td>
                      <td className="px-4 py-3">
                        {f.titular.apellido}, {f.titular.nombre}
                      </td>
                      <td className="px-4 py-3">{f.socios.length}</td>
                    </tr>
                  ))}
                  {familias.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-slate-500">
                        {t("messages.noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <FloatingActionButton
            onClick={() => router.push("/socios/familias/nuevo")}
            aria-label={t("admin.familias.createFamilia")}
          />
        </div>
      )}
    </div>
  );
}
