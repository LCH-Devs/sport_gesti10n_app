"use client";

import React, { useEffect, useState, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Header, Card, Button } from "@/components/common";
import { apiFetch, getPlatformSession } from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

type AdminUser = {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
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
      const [admins, pendientes] = await Promise.all([
        apiFetch<AdminUser[]>("/platform/admins", {
          token: session.access_token,
        }),
        apiFetch<{ count: number }>("/platform/solicitudes/pendientes/count", {
          token: session.access_token,
        }),
      ]);
      setUsers(admins);
      setPendingCount(pendientes.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

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
              router.push("/supercalifragilisticoespiralidoso/panel/entidades/new")
            }
          >
            {t("dashboard.addInstitution")}
          </Button>
        </div>
      </Header>

      <div className="p-6">
        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}
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
                {metric.change === "solicitudes" ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(
                        "/supercalifragilisticoespiralidoso/panel/solicitudes",
                      )
                    }
                  >
                    {t("dashboard.resolve")}
                  </Button>
                ) : (
                  <p className="text-sm text-slate-600">{metric.change}</p>
                )}
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t("dashboard.monthlyQuotas")}
            </h3>
            <p className="text-4xl font-bold text-blue-600 mb-2">$1.2M</p>
            <p className="text-sm text-slate-600">
              {t("dashboard.goalPercentage")}
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t("dashboard.pendingPayments")}
            </h3>
            <p className="text-4xl font-bold text-slate-900 mb-4">$345K</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("dashboard.exampleClub1")}</span>
                <span className="text-red-600">$12,000</span>
              </div>
              <div className="flex justify-between">
                <span>{t("dashboard.exampleClub2")}</span>
                <span className="text-red-600">$8,500</span>
              </div>
            </div>
            <button className="text-blue-600 text-sm font-medium mt-4">
              {t("dashboard.viewAll")}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
