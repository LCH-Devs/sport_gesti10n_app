"use client";

import React, { useEffect, useState, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  UserGroupIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Header, Card, Badge, Button } from "@/components/common";
import { apiFetch, getPlatformSession } from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

type ClubRow = {
  id: number;
  nombre: string;
  activo: boolean;
  plan: string;
  plan_hasta: number;
  precio_usd_mes: number;
  plan_pendiente_precio: number | null;
  plan_pendiente_confirmado_at: string | null;
  ciudad: string | null;
  provincia: string | null;
  _count?: { socios: number };
};

type Resumen = {
  clubs_activos: number;
  socios_totales: number;
  solicitudes_pendientes: number;
  planes_sin_confirmar: number;
};

type Pendiente = {
  id: number;
  nombre: string;
  socios_activos: number;
  plan: string;
  plan_hasta: number;
  precio_usd_mes: number;
  pendiente_precio: number | null;
  pendiente_hasta: number | null;
  pendiente_en_at: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    if (!opts?.silent) setLoading(true);
    setError("");
    try {
      const [resumenData, pendientesData, clubsData] = await Promise.all([
        apiFetch<Resumen>("/platform/resumen", {
          token: session.access_token,
        }),
        apiFetch<Pendiente[]>("/platform/planes/pendientes", {
          token: session.access_token,
        }),
        apiFetch<ClubRow[]>("/platform/clubs", {
          token: session.access_token,
        }),
      ]);
      setResumen(resumenData);
      setPendientes(pendientesData);
      setClubs(clubsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onResume() {
      if (document.visibilityState !== "visible") return;
      void load({ silent: true });
    }
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
    };
  }, [load]);

  async function clubAction(club: ClubRow, action: "suspend" | "delete") {
    const session = getPlatformSession();
    if (!session) return;
    if (action === "delete") {
      if (
        !window.confirm(
          `¿Dar de baja ${club.nombre}? El club se suspende y deja de operar. Los datos se conservan y el email del admin queda libre para otro club.`,
        )
      )
        return;
      await apiFetch(`/platform/clubs/${club.id}`, {
        method: "DELETE",
        token: session.access_token,
      });
    } else {
      await apiFetch(`/platform/clubs/${club.id}`, {
        method: "PATCH",
        token: session.access_token,
        body: JSON.stringify({ activo: club.activo === false }),
      });
    }
    await load();
  }

  async function forzarConfirm(id: number) {
    const session = getPlatformSession();
    if (!session) return;
    await apiFetch(`/platform/clubs/${id}/plan/confirmar`, {
      method: "POST",
      token: session.access_token,
    });
    await load();
  }

  async function reenviarMail(id: number) {
    const session = getPlatformSession();
    if (!session) return;
    await apiFetch(`/platform/clubs/${id}/plan/reenviar-mail`, {
      method: "POST",
      token: session.access_token,
    });
    await load();
  }

  const metrics = [
    {
      label: "Clubes activos",
      value: resumen?.clubs_activos ?? "—",
      icon: BuildingLibraryIcon,
    },
    {
      label: "Socios en la red",
      value: resumen?.socios_totales ?? "—",
      icon: UserGroupIcon,
    },
    {
      label: "Solicitudes pendientes",
      value: resumen?.solicitudes_pendientes ?? "—",
      icon: ExclamationTriangleIcon,
      href: "/supercalifragilisticoespiralidoso/panel/solicitudes",
    },
    {
      label: "Planes sin confirmar",
      value: resumen?.planes_sin_confirmar ?? "—",
      icon: ExclamationTriangleIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t("dashboard.overview")}
        subtitle={t("dashboard.realtime")}
      >
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            disabled={loading}
            onClick={() => void load()}
          >
            {t("common.refresh")}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              router.push("/supercalifragilisticoespiralidoso/panel/planes")
            }
          >
            Planes
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              router.push(
                "/supercalifragilisticoespiralidoso/panel/entidades/new",
              )
            }
          >
            {t("dashboard.addInstitution")}
          </Button>
        </div>
      </Header>

      <div className="p-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {loading && (
          <p className="mb-4 text-sm text-slate-500">{t("common.loading")}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const n = Number(metric.value);
            const warn = metric.label.includes("pendiente") || metric.label.includes("sin confirmar");
            const color =
              warn && n > 0 ? "text-amber-600" : "text-blue-600";
            return (
              <Card key={metric.label}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {metric.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {metric.value.toString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </div>
                {metric.href && (
                  <Button
                    onClick={() => router.push(metric.href)}
                  >
                    {t("solicitudes.resolver")}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {pendientes.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Superaron el plan y no confirmaron
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              El socio ya está cargado. El precio no sube hasta que confirmen o
              soporte lo force.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b">
                    <th className="py-2 pr-4">Club</th>
                    <th className="py-2 pr-4">Uso</th>
                    <th className="py-2 pr-4">Precio</th>
                    <th className="py-2 pr-4">Desde</th>
                    <th className="py-2 pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium">{row.nombre}</td>
                      <td className="py-2 pr-4 text-red-600">
                        {row.socios_activos} / {row.plan_hasta}
                      </td>
                      <td className="py-2 pr-4">
                        USD {row.precio_usd_mes} → {row.pendiente_precio}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {row.pendiente_en_at
                          ? new Date(row.pendiente_en_at).toLocaleDateString("es-AR")
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void reenviarMail(row.id)}>
                          Reenviar mail
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void forzarConfirm(row.id)}
                        >
                          Forzar confirmación
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t("clubs.title")}
          </h3>
          {clubs.length === 0 && !loading ? (
            <p className="text-sm text-slate-500">{t("messages.noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Socios</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">USD/mes</th>
                    <th className="py-2 pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((club) => {
                    const socios = club._count?.socios ?? 0;
                    const over = socios > club.plan_hasta;
                    return (
                    <tr key={club.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {club.nombre}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{club.plan}</td>
                      <td className={`py-2 pr-4 ${over ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                        {socios} / {club.plan_hasta}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          label={club.activo ? t("clubs.active") : t("clubs.inactive")}
                          variant={club.activo ? "success" : "error"}
                        />
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        USD {club.precio_usd_mes}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            title={club.activo ? "Suspender" : "Reactivar"}
                            aria-label={club.activo ? "Suspender" : "Reactivar"}
                            onClick={() => void clubAction(club, "suspend")}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-amber-600"
                          >
                            {club.activo ? (
                              <PauseCircleIcon className="w-5 h-5" />
                            ) : (
                              <PlayCircleIcon className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Eliminar"
                            aria-label="Eliminar"
                            onClick={() => void clubAction(club, "delete")}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-red-600"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 font-semibold text-slate-900">
                    <td className="py-2 pr-4" colSpan={4}>
                      Total
                    </td>
                    <td className="py-2 pr-4">
                      USD{" "}
                      {clubs
                        .reduce((sum, club) => sum + club.precio_usd_mes, 0)
                        .toLocaleString("es-AR")}
                    </td>
                    <td className="py-2 pr-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
