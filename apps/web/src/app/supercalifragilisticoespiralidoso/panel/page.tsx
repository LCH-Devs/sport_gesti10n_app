"use client";

import React, { useEffect, useState, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  TrashIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { Header, Card, Badge, Button } from "@/components/common";
import { apiFetch, getPlatformSession } from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

type AdminUser = {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
};

type ClubRow = {
  id: number;
  nombre: string;
  activo: boolean;
  precio_usd_mes: number;
  ciudad: string | null;
  provincia: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [admins, pendientes, clubsData] = await Promise.all([
        apiFetch<AdminUser[]>("/platform/admins", {
          token: session.access_token,
        }),
        apiFetch<{ count: number }>("/platform/solicitudes/pendientes/count", {
          token: session.access_token,
        }),
        apiFetch<ClubRow[]>("/platform/clubs", {
          token: session.access_token,
        }),
      ]);
      setUsers(admins);
      setPendingCount(pendientes.count);
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

  function generarLinkPago(_club: ClubRow) {
    window.alert("Función en desarrollo");
  }

  const metrics = [
    {
      label: t("dashboard.totalAdmins"),
      value: users.length.toString(),
      change: t("dashboard.realtime"),
      icon: UserGroupIcon,
    },
    {
      label: t("dashboard.activeUsers"),
      value: users.filter((u) => u.activo).length.toString(),
      change: t("dashboard.realtime"),
      icon: DocumentTextIcon,
    },
    {
      label: t("dashboard.systemHealth"),
      value: pendingCount,
      change: "solicitudes",
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
          <Button size="md">{t("dashboard.exportReport")}</Button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const n = Number(metric.value);
            const isHealth = metric.icon === ExclamationTriangleIcon;
            const healthColor =
              n < 5
                ? "text-green-600"
                : n <= 10
                  ? "text-yellow-600"
                  : "text-red-600";
            return (
              <Card key={index}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {metric.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {metric.value.toString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon
                      className={`w-6 h-6 ${isHealth ? healthColor : "text-blue-600"}`}
                    />
                  </div>
                </div>

                {metric.change === "solicitudes" && (
                  <Button
                    onClick={() =>
                      router.push(
                        "/supercalifragilisticoespiralidoso/panel/solicitudes",
                      )
                    }
                  >
                    {t("solicitudes.resolver")}
                  </Button>
                )}
                {metric.change !== "solicitudes" && (
                  <p className="text-sm text-slate-600">{metric.change}</p>
                )}
              </Card>
            );
          })}
        </div>

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
                    <th className="py-2 pr-4">Ubicación</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Cuota</th>
                    <th className="py-2 pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((club) => (
                    <tr key={club.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {club.nombre}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {[club.ciudad, club.provincia]
                          .filter(Boolean)
                          .join(", ") || "-"}
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
                          <button
                            type="button"
                            title="Generar link de pago"
                            aria-label="Generar link de pago"
                            onClick={() => generarLinkPago(club)}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          >
                            <LinkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 font-semibold text-slate-900">
                    <td className="py-2 pr-4" colSpan={3}>
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
