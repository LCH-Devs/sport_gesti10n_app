"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Header, Badge, Button, DataTable, type Column } from "@/components/common";
import { apiFetch, getPlatformSession } from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

type EstadoSolicitud =
  | "pendiente"
  | "trial"
  | "aprobada"
  | "cancelada"
  | "borradas";

type Solicitud = {
  id: number;
  nombre: string;
  apellido: string;
  nombre_club: string;
  email: string;
  telefono: string;
  cantidad_miembros: number;
  estado: EstadoSolicitud;
  fecha_solicitud: string;
  fecha_trial: string | null;
  fecha_aprobada: string | null;
  fecha_cancelada: string | null;
  fecha_eliminada: string | null;
};

const ESTADOS: EstadoSolicitud[] = [
  "pendiente",
  "trial",
  "aprobada",
  "cancelada",
];

const TABS: TabId[] = ["", "pendiente", "trial", "aprobada", "cancelada"];
const TRIAL_MS = 30 * 24 * 60 * 60 * 1000;

function fechaDeEstado(row: Solicitud): string {
  const iso =
    row.estado === "trial"
      ? row.fecha_trial
      : row.estado === "aprobada"
        ? row.fecha_aprobada
        : row.estado === "cancelada"
          ? row.fecha_cancelada
            : row.fecha_solicitud;
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function trialRestanteLabel(
  row: Solicitud,
  now: number,
  vencido: string,
): string {
  if (row.estado !== "trial" || !row.fecha_trial) return "—";
  const ms = new Date(row.fecha_trial).getTime() + TRIAL_MS - now;
  if (ms <= 0) return vencido;
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  return `${dias}d ${horas}h`;
}

function badgeVariant(
  estado: EstadoSolicitud,
): "success" | "warning" | "error" | "info" | "pending" {
  if (estado === "aprobada") return "success";
  if (estado === "trial") return "info";
  if (estado === "cancelada") return "warning";
  return "pending";
}

export default function SolicitudesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [rows, setRows] = useState<Solicitud[]>([]);
  const [tab, setTab] = useState<TabId>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<Solicitud[]>("/platform/solicitudes", {
        token: session.access_token,
      });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const byEstado = {
      pendiente: 0,
      trial: 0,
      aprobada: 0,
      cancelada: 0,
    };
    for (const row of rows) {
      if (row.estado in byEstado) {
        byEstado[row.estado as keyof typeof byEstado] += 1;
      }
    }
    return { all: rows.length, ...byEstado };
  }, [rows]);

  const visibleRows = useMemo(
    () => (tab ? rows.filter((r) => r.estado === tab) : rows),
    [rows, tab],
  );

  async function changeEstado(row: Solicitud, next: EstadoSolicitud) {
    if (next === row.estado) return;
    if (next === "trial") {
      router.push(
        `/supercalifragilisticoespiralidoso/panel/entidades/new?solicitud_id=${row.id}`,
      );
      return;
    }
    const session = getPlatformSession();
    if (!session) return;
    setSavingId(row.id);
    setError("");
    try {
      await apiFetch(`/platform/solicitudes/${row.id}`, {
        method: "PATCH",
        token: session.access_token,
        body: JSON.stringify({ estado: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.errorSaving"));
    } finally {
      setSavingId(null);
    }
  }

  const columns: Column<Solicitud>[] = [
    {
      key: "nombre",
      header: t("dashboard.name"),
      sortable: true,
      render: (r) => `${r.nombre} ${r.apellido}`,
      accessor: (r) => `${r.nombre} ${r.apellido}`,
    },
    {
      key: "nombre_club",
      header: t("landing.contactClub"),
      sortable: true,
    },
    { key: "email", header: t("dashboard.email"), sortable: true },
    { key: "telefono", header: t("landing.contactPhone") },
    {
      key: "cantidad_miembros",
      header: t("landing.contactMembers"),
      align: "right",
    },
    {
      key: "estado",
      header: t("dashboard.status"),
      render: (r) => (
        <Badge label={t(`solicitudes.estado.${r.estado}`)} variant={badgeVariant(r.estado)} />
      ),
    },
    {
      key: "fecha",
      header: t("solicitudes.fechaEstado"),
      render: (r) => fechaDeEstado(r),
    },
    {
      key: "trial",
      header: t("solicitudes.trialRestante"),
      render: (r) => trialRestanteLabel(r, now, t("solicitudes.trialVencido")),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t("solicitudes.title")}
        subtitle={t("solicitudes.subtitle")}
      >
        <Button size="md" variant="secondary" onClick={() => void load()}>
          {t("common.refresh")}
        </Button>
      </Header>

      <div className="p-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <nav className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
          {TABS.map((id) => {
            const active = tab === id;
            const label = id ? t(`solicitudes.estado.${id}`) : t("solicitudes.all");
            const count = id ? counts[id] : counts.all;
            return (
              <button
                key={id || "all"}
                type="button"
                onClick={() => setTab(id)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
                <Badge
                  label={String(count)}
                  variant={id ? badgeVariant(id) : "info"}
                />
              </button>
            );
          })}
        </nav>
        <DataTable
          columns={columns}
          data={visibleRows}
          getRowId={(r) => r.id}
          loading={loading}
          emptyMessage={t("solicitudes.empty")}
          actions={(r) => (
            <select
              value={r.estado}
              disabled={savingId === r.id}
              onChange={(e) =>
                void changeEstado(r, e.target.value as EstadoSolicitud)
              }
              className="select-field-sm"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {t(`solicitudes.estado.${s}`)}
                </option>
              ))}
            </select>
          )}
        />
      </div>
    </div>
  );
}
