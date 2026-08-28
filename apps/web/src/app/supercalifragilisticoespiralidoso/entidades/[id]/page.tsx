"use client";

import React, { useCallback, useEffect, useState } from "react";
import { notFound, useRouter, useParams } from "next/navigation";
import {
  UserGroupIcon,
  HomeModernIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  FireIcon,
  ClockIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  BanknotesIcon,
  DocumentTextIcon,
  TrophyIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { Header, Card, Badge, Button } from "@/components/common";
import { DataTable } from "@/components/common/DataTable";
import { useTranslation } from "@/lib/useTranslation";
import { apiFetch, getPlatformSession, mediaUrl } from "@/lib/api";

type ClubReadSession = { access_token: string; clubSlug: string; clubId: number };

type ClubData = {
  id: number;
  slug: string;
  nombre: string;
  logo_url: string | null;
  activo: boolean;
  plan: string;
  cuota_monto: number;
  direccion: string | null;
  telefono_club: string | null;
  email_contacto: string | null;
  cuit_cuil: string | null;
  titular_nombre: string | null;
  titular_apellido: string | null;
};

type Actividad = { id: number; nombre: string };
type Socio = { id: number };
type Espacio = { id: number };

type SectionKey =
  | "socios"
  | "espacios"
  | "actividades"
  | "horarios"
  | "reservas"
  | "familias"
  | "noticias"
  | "usuarios"
  | "torneos"
  | "cobros"
  | "liquidaciones";

type ColumnDef = { key: string; label: string; render: (row: any) => React.ReactNode };
type SectionDef = {
  label: string;
  columns: ColumnDef[];
  fetch: (session: ClubReadSession) => Promise<any[]>;
};

function buildSectionConfig(
  t: (key: string, defaultValue?: string) => string,
): Record<SectionKey, SectionDef> {
  const yesNo = (v: boolean) => (v ? t("common.yes") : t("common.no"));
  const fetchList = (session: ClubReadSession, resource: string) =>
    apiFetch<any[]>(`/platform/clubs/${session.clubId}/resources/${resource}`, { token: session.access_token });

  return {
    socios: {
      label: t("clubManagement.links.socios"),
      columns: [
        { key: "dni", label: t("admin.socios.dni"), render: (r) => r.dni },
        { key: "nombre", label: t("admin.socios.nombre"), render: (r) => r.nombre },
        { key: "apellido", label: t("admin.socios.apellido"), render: (r) => r.apellido },
        { key: "email", label: t("admin.socios.email"), render: (r) => r.email },
        { key: "estado", label: t("admin.socios.estado"), render: (r) => r.estado },
      ],
      fetch: (session) => fetchList(session, "socios"),
    },
    espacios: {
      label: t("clubManagement.links.espacios"),
      columns: [
        { key: "nombre", label: t("admin.espacios.nombre"), render: (r) => r.nombre },
        { key: "tipo", label: t("admin.espacios.tipo"), render: (r) => r.tipo },
        {
          key: "slot",
          label: t("admin.espacios.slot"),
          render: (r) => `${r.duracion_slot_min} min`,
        },
        {
          key: "horario",
          label: t("admin.espacios.horario"),
          render: (r) => `${r.hora_apertura} – ${r.hora_cierre}`,
        },
        {
          key: "activo",
          label: t("admin.espacios.activo"),
          render: (r) => yesNo(r.activo),
        },
      ],
      fetch: (session) => fetchList(session, "espacios"),
    },
    actividades: {
      label: t("clubManagement.links.actividades"),
      columns: [
        { key: "nombre", label: t("admin.actividades.nombre"), render: (r) => r.nombre },
        {
          key: "modoCobro",
          label: t("admin.actividades.modoCobro"),
          render: (r) => r.modo_cobro,
        },
        {
          key: "adicional",
          label: t("admin.actividades.adicional"),
          render: (r) => `$${r.monto_adicional}`,
        },
        {
          key: "activo",
          label: t("admin.espacios.activo"),
          render: (r) => yesNo(r.activo),
        },
      ],
      fetch: (session) => fetchList(session, "actividades"),
    },
    horarios: {
      label: t("clubManagement.links.horarios"),
      columns: [
        { key: "titulo", label: t("admin.horarios.titulo"), render: (r) => r.titulo },
        { key: "dias", label: t("admin.horarios.dias"), render: (r) => r.dias },
        {
          key: "horario",
          label: t("admin.espacios.horario"),
          render: (r) => `${r.hora_inicio} – ${r.hora_fin}`,
        },
        {
          key: "activo",
          label: t("admin.espacios.activo"),
          render: (r) => yesNo(r.activo),
        },
      ],
      fetch: (session) => fetchList(session, "horarios"),
    },
    reservas: {
      label: t("clubManagement.links.reservas"),
      columns: [
        {
          key: "espacio",
          label: t("admin.reservas.espacio"),
          render: (r) => r.espacio?.nombre,
        },
        {
          key: "socio",
          label: t("admin.reservas.socio"),
          render: (r) => `${r.socio?.apellido}, ${r.socio?.nombre}`,
        },
        {
          key: "inicio",
          label: t("admin.reservas.inicio"),
          render: (r) => new Date(r.inicio).toLocaleString("es-AR"),
        },
        {
          key: "fin",
          label: t("admin.reservas.fin"),
          render: (r) => new Date(r.fin).toLocaleString("es-AR"),
        },
        { key: "estado", label: t("admin.reservas.estado"), render: (r) => r.estado },
      ],
      fetch: (session) => fetchList(session, "reservas"),
    },
    familias: {
      label: t("clubManagement.links.familias"),
      columns: [
        { key: "nombre", label: t("admin.familias.nombre"), render: (r) => r.nombre },
        {
          key: "titular",
          label: t("admin.familias.titular"),
          render: (r) => `${r.titular?.apellido}, ${r.titular?.nombre}`,
        },
        {
          key: "miembros",
          label: t("admin.familias.miembros"),
          render: (r) => r.socios?.length ?? 0,
        },
      ],
      fetch: (session) => fetchList(session, "familias"),
    },
    noticias: {
      label: t("clubManagement.links.noticias"),
      columns: [
        { key: "titulo", label: t("admin.noticias.titulo"), render: (r) => r.titulo },
        {
          key: "esEvento",
          label: t("admin.noticias.esEvento"),
          render: (r) => yesNo(r.es_evento),
        },
        {
          key: "fecha",
          label: t("admin.torneos.fecha"),
          render: (r) => new Date(r.fecha).toLocaleDateString("es-AR"),
        },
      ],
      fetch: (session) => fetchList(session, "noticias"),
    },
    usuarios: {
      label: t("clubManagement.links.usuarios"),
      columns: [
        { key: "nombre", label: t("dashboard.name"), render: (r) => r.nombre },
        { key: "email", label: t("dashboard.email"), render: (r) => r.email },
        { key: "rol", label: t("dashboard.role"), render: (r) => r.rol },
      ],
      fetch: (session) => fetchList(session, "usuarios"),
    },
    torneos: {
      label: t("clubManagement.links.torneos"),
      columns: [
        { key: "nombre", label: t("admin.torneos.nombre"), render: (r) => r.nombre },
        { key: "deporte", label: t("admin.torneos.deporte"), render: (r) => r.deporte },
        { key: "estado", label: t("dashboard.status"), render: (r) => r.estado },
        {
          key: "partidos",
          label: t("admin.torneos.partidos"),
          render: (r) => r._count?.partidos ?? 0,
        },
      ],
      fetch: (session) => fetchList(session, "torneos"),
    },
    cobros: {
      label: t("clubManagement.links.cobros"),
      columns: [
        {
          key: "socio",
          label: t("dashboard.member"),
          render: (r) => `${r.socio?.apellido}, ${r.socio?.nombre}`,
        },
        { key: "dni", label: t("dashboard.dni"), render: (r) => r.socio?.dni },
        { key: "monto", label: t("clubManagement.amount"), render: (r) => `$${r.monto}` },
        { key: "estado", label: t("dashboard.status"), render: (r) => r.estado },
      ],
      fetch: async (session) => {
        const now = new Date();
        const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const data = await apiFetch<{ pagos: any[] }>(
          `/platform/clubs/${session.clubId}/resources/cobros`,
          { token: session.access_token },
        );
        return data.pagos || [];
      },
    },
    liquidaciones: {
      label: t("clubManagement.links.liquidaciones"),
      columns: [
        { key: "mes", label: t("admin.liquidaciones.mes"), render: (r) => r.mes },
        {
          key: "profesor",
          label: t("admin.liquidaciones.profesor"),
          render: (r) => `${r.profe?.apellido}, ${r.profe?.nombre}`,
        },
        {
          key: "totalClub",
          label: t("admin.liquidaciones.totalClub"),
          render: (r) => `$${r.total_club}`,
        },
        { key: "estado", label: t("dashboard.status"), render: (r) => r.estado },
      ],
      fetch: (session) => fetchList(session, "liquidaciones"),
    },
  };
}

type SectionCategory = "admin" | "ops" | "finance";

const sectionMeta: Record<
  SectionKey,
  {
    icon: React.ComponentType<{ className?: string }>;
    category: SectionCategory;
  }
> = {
  socios: { icon: UserGroupIcon, category: "admin" },
  familias: { icon: HomeModernIcon, category: "admin" },
  usuarios: { icon: IdentificationIcon, category: "admin" },
  espacios: { icon: BuildingOffice2Icon, category: "ops" },
  actividades: { icon: FireIcon, category: "ops" },
  horarios: { icon: ClockIcon, category: "ops" },
  reservas: { icon: CalendarDaysIcon, category: "ops" },
  noticias: { icon: MegaphoneIcon, category: "ops" },
  cobros: { icon: BanknotesIcon, category: "finance" },
  liquidaciones: { icon: DocumentTextIcon, category: "finance" },
  torneos: { icon: TrophyIcon, category: "finance" },
};

const categoryColors: Record<
  SectionCategory,
  {
    activeBorder: string;
    inactiveBorder: string;
    activeIcon: string;
    inactiveIcon: string;
  }
> = {
  admin: {
    activeBorder: "border-t-blue-600",
    inactiveBorder: "border-t-blue-200",
    activeIcon: "text-blue-600",
    inactiveIcon: "text-slate-400",
  },
  ops: {
    activeBorder: "border-t-green-600",
    inactiveBorder: "border-t-green-200",
    activeIcon: "text-green-600",
    inactiveIcon: "text-slate-400",
  },
  finance: {
    activeBorder: "border-t-indigo-600",
    inactiveBorder: "border-t-indigo-200",
    activeIcon: "text-indigo-600",
    inactiveIcon: "text-slate-400",
  },
};

const sectionKeys: SectionKey[] = [
  "socios",
  "familias",
  "usuarios",
  "espacios",
  "actividades",
  "horarios",
  "reservas",
  "noticias",
  "cobros",
  "liquidaciones",
  "torneos",
];

export default function ClubManagementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [club, setClub] = useState<ClubData | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isClubNotFound, setIsClubNotFound] = useState(false);

  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [sectionRows, setSectionRows] = useState<any[]>([]);
  const [readSession, setReadSession] = useState<ClubReadSession | null>(null);

  const sectionConfig = buildSectionConfig(t);

  const load = useCallback(async () => {
    const platformSession = getPlatformSession();
    if (!platformSession) {
      notFound();
      return;
    }
    setLoading(true);
    setError("");
    setIsClubNotFound(false);
    try {
      const clubData = await apiFetch<ClubData>(
        `/platform/clubs/${params.id}`,
        { token: platformSession.access_token },
      );
      const clubSlug = clubData.slug;
      const [actividadesData, sociosData, espaciosData] = await Promise.all([
        apiFetch<Actividad[]>(`/platform/clubs/${params.id}/resources/actividades`, { token: platformSession.access_token }),
        apiFetch<Socio[]>(`/platform/clubs/${params.id}/resources/socios`, { token: platformSession.access_token }),
        apiFetch<Espacio[]>(`/platform/clubs/${params.id}/resources/espacios`, { token: platformSession.access_token }),
      ]);
      setClub(clubData);
      setActividades(actividadesData);
      setSocios(sociosData);
      setEspacios(espaciosData);
      setReadSession({ access_token: platformSession.access_token, clubSlug, clubId: clubData.id });
    } catch (err) {
      setIsClubNotFound(true);
      setError(err instanceof Error ? err.message : t("messages.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [params.id, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSelectSection(key: SectionKey) {
    if (activeSection === key || !readSession) return;
    setActiveSection(key);
    setSectionLoading(true);
    setSectionError("");
    setSectionRows([]);
    try {
      const rows = await sectionConfig[key].fetch(readSession);
      setSectionRows(rows);
    } catch (err) {
      setSectionError(
        err instanceof Error ? err.message : t("messages.errorLoading"),
      );
    } finally {
      setSectionLoading(false);
    }
  }

  if (isClubNotFound) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title={t("clubManagement.title")} />
        <div className="p-6">
          <Card>
            <p className="text-slate-600">{t("clubManagement.notFound")}</p>
            <Button className="mt-4" onClick={() => router.push("/supercalifragilisticoespiralidoso/entidades")}>
              {t("clubManagement.backToClubs")}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={club ? club.nombre : t("clubManagement.title")}
        subtitle={t("clubManagement.subtitle")}
      >
        <Button variant="secondary" onClick={() => router.push("/supercalifragilisticoespiralidoso/entidades")}>
          ← {t("clubManagement.backToClubs")}
        </Button>
      </Header>

      <div className="p-6">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-slate-500">{t("common.loading")}</p>
        ) : club ? (
          <>
            {/* Club Overview */}
            <Card className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-md bg-blue-100 flex items-center justify-center text-3xl overflow-hidden">
                    {club.logo_url ? (
                      <img
                        src={mediaUrl(club.logo_url)}
                        alt={club.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "⚽"
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {club.nombre}
                    </h2>
                    <Badge
                      label={
                        club.activo ? t("clubs.active") : t("clubs.inactive")
                      }
                      variant={club.activo ? "success" : "error"}
                    />
                  </div>
                </div>
                <Badge label={club.plan.toUpperCase()} variant="info" />
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  {t("clubManagement.totalMembers")}
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {socios.length}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  {t("clubManagement.totalActivities")}
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {actividades.length}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  {t("clubManagement.totalSpaces")}
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {espacios.length}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Contact Info */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {t("clubManagement.contactInfo")}
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>📍 {club.direccion || t("clubManagement.notProvided")}</p>
                  <p>
                    📞 {club.telefono_club || t("clubManagement.notProvided")}
                  </p>
                  <p>
                    ✉️ {club.email_contacto || t("clubManagement.notProvided")}
                  </p>
                </div>
              </Card>

              {/* Legal Info */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {t("clubManagement.legalInfo")}
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    {t("clubManagement.titular")}:{" "}
                    {club.titular_nombre
                      ? `${club.titular_nombre} ${club.titular_apellido || ""}`
                      : t("clubManagement.notProvided")}
                  </p>
                  <p>
                    CUIT/CUIL:{" "}
                    {club.cuit_cuil || t("clubManagement.notProvided")}
                  </p>
                  <p>
                    {t("clubManagement.monthlyFee")}: ${club.cuota_monto}
                  </p>
                </div>
              </Card>
            </div>

            {/* Disciplines */}
            {actividades.length > 0 && (
              <Card className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {t("clubManagement.disciplines")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {actividades.map((a) => (
                    <span
                      key={a.id}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {a.nombre}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Gestionar Secciones — estilo archivero */}
            <div className="mt-8">
              <div className="flex items-end gap-1 overflow-x-auto">
                {sectionKeys.map((key) => {
                  const meta = sectionMeta[key];
                  const Icon = meta.icon;
                  const colors = categoryColors[meta.category];
                  const isActive = activeSection === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSelectSection(key)}
                      className={`flex shrink-0 flex-col items-center justify-center min-w-[80px] py-2 rounded-t-xl border-t-4 border-x border-b-white transition-all ${
                        isActive
                          ? `bg-white shadow-sm border-slate-200 ${colors.activeBorder}`
                          : `bg-slate-100 hover:bg-slate-200 border-slate-200 ${colors.inactiveBorder}`
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mb-1 ${
                          isActive ? colors.activeIcon : colors.inactiveIcon
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-tight ${
                          isActive ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {t(`clubManagement.links.${key}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-8 min-h-[300px] shadow-sm -mt-px">
                {!activeSection ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FolderOpenIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t("clubManagement.selectSection")}
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                      {t("clubManagement.selectSectionDesc")}
                    </p>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      {sectionConfig[activeSection].label}
                    </h4>
                    {sectionError && (
                      <p className="text-sm text-red-600 mb-3">
                        {sectionError}
                      </p>
                    )}
                    <DataTable
                      columns={sectionConfig[activeSection].columns.map((col) => ({
                        key: col.key,
                        header: col.label,
                        render: col.render,
                        sortable: true,
                      }))}
                      data={sectionRows}
                      getRowId={(row) => row.id}
                      loading={sectionLoading}
                      emptyMessage={t("messages.noData")}
                    />
                  </>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
