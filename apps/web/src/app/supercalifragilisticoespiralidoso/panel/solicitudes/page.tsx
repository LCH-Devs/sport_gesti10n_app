"use client";

import React, { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
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
  "borradas",
];

function fechaDeEstado(row: Solicitud): string {
  const iso =
    row.estado === "trial"
      ? row.fecha_trial
      : row.estado === "aprobada"
        ? row.fecha_aprobada
        : row.estado === "cancelada"
          ? row.fecha_cancelada
          : row.estado === "borradas"
            ? row.fecha_eliminada
            : row.fecha_solicitud;
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function badgeVariant(
  estado: EstadoSolicitud,
): "success" | "warning" | "error" | "info" | "pending" {
  if (estado === "aprobada") return "success";
  if (estado === "trial") return "info";
  if (estado === "cancelada") return "warning";
  if (estado === "borradas") return "error";
  return "pending";
}

export default function SolicitudesPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Solicitud[]>([]);
  const [estado, setEstado] = useState<EstadoSolicitud | "">("pendiente");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const qs = estado ? `?estado=${estado}` : "";
      const data = await apiFetch<Solicitud[]>(`/platform/solicitudes${qs}`, {
        token: session.access_token,
      });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [estado, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeEstado(row: Solicitud, next: EstadoSolicitud) {
    if (next === row.estado) return;
    const session = getPlatformSession();
    if (!session) return;
    if (next === "borradas" && !window.confirm(t("solicitudes.confirmDelete"))) {
      return;
    }
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
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t("solicitudes.title")}
        subtitle={t("solicitudes.subtitle")}
      >
        <div className="flex gap-2">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoSolicitud | "")}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t("solicitudes.all")}</option>
            {ESTADOS.filter((s) => s !== "borradas").map((s) => (
              <option key={s} value={s}>
                {t(`solicitudes.estado.${s}`)}
              </option>
            ))}
          </select>
          <Button size="md" variant="secondary" onClick={() => void load()}>
            {t("common.refresh")}
          </Button>
        </div>
      </Header>

      <div className="p-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <DataTable
          columns={columns}
          data={rows}
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
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
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
