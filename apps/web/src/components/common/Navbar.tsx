"use client";

import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  clearPlatformSession,
  clearSession,
  clearSocioSession,
  getPlatformSession,
  getSession,
  getSocioSession,
  listNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  mediaUrl,
  type CuentaOption,
  type NotificacionItem,
} from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";
import ClubAccountSwitcher from "@/components/ClubAccountSwitcher";

interface NavbarProps {
  onMenuClick?: () => void;
  gradient?: boolean;
}

const NOTIFICACIONES_POLL_MS = 30000;

function timeAgo(iso: string, locale: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffMin < 1) return rtf.format(0, "minute");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return rtf.format(-diffH, "hour");
  const diffD = Math.round(diffH / 24);
  return rtf.format(-diffD, "day");
}

export function Navbar({ onMenuClick, gradient }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] =
    React.useState<NotificacionItem[]>([]);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const [clubName, setClubName] = React.useState("Kanri");
  const [clubLogoUrl, setClubLogoUrl] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState("User");
  const [configHref, setConfigHref] = React.useState("/gestion/config");
  const [switcher, setSwitcher] = React.useState<{
    token: string;
    cuentas?: CuentaOption[];
    currentMembresiaId?: number;
  } | null>(null);
  const [notifAuth, setNotifAuth] = React.useState<{
    token: string;
    clubSlug: string;
  } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang } = useTranslation();

  React.useEffect(() => {
    function syncSession() {
      const session = getSession();
      const socioSession = getSocioSession();
      const platformSession = getPlatformSession();
      const isPlatformRoute = pathname.startsWith(
        "/supercalifragilisticoespiralidoso/",
      );

      if (isPlatformRoute) {
        setClubName("Kanri");
        setClubLogoUrl(null);
        setUserName(platformSession?.platform_admin.nombre || "SuperAdmin");
        setConfigHref("/supercalifragilisticoespiralidoso/panel/perfil");
        setSwitcher(null);
        setNotifAuth(null);
      } else {
        setClubName(session?.club.nombre || "Kanri");
        setClubLogoUrl(session?.club.logo_url || null);
        setUserName(session?.admin.nombre || socioSession?.socio.nombre || "User");
        setConfigHref("/gestion/config");
        if (session) {
          setSwitcher({
            token: session.access_token,
            cuentas: session.cuentas,
            currentMembresiaId: session.admin.id,
          });
          setNotifAuth({ token: session.access_token, clubSlug: session.club.slug });
        } else if (socioSession) {
          setSwitcher({
            token: socioSession.access_token,
            cuentas: socioSession.cuentas,
            currentMembresiaId: socioSession.socio.id,
          });
          setNotifAuth({ token: socioSession.access_token, clubSlug: socioSession.club.slug });
        } else {
          setSwitcher(null);
          setNotifAuth(null);
        }
      }
    }

    syncSession();
    window.addEventListener("club-session-changed", syncSession);
    return () =>
      window.removeEventListener("club-session-changed", syncSession);
  }, [pathname]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!notifAuth) {
      setNotifications([]);
      return;
    }
    let cancelled = false;
    function fetchNotifications() {
      listNotificaciones(notifAuth!.token, notifAuth!.clubSlug)
        .then((data) => {
          if (!cancelled) setNotifications(data);
        })
        .catch(() => {});
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, NOTIFICACIONES_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [notifAuth]);

  const unreadCount = notifications.filter((n) => !n.leido).length;

  function markAllRead() {
    if (!notifAuth) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, leido: true })));
    marcarTodasNotificacionesLeidas(notifAuth.token, notifAuth.clubSlug).catch(() => {});
  }

  function markOneRead(id: number) {
    if (!notifAuth) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n)),
    );
    marcarNotificacionLeida(id, notifAuth.token, notifAuth.clubSlug).catch(() => {});
  }

  const userInitial = userName.charAt(0).toUpperCase() || "U";

  function handleLogout() {
    clearSession();
    clearSocioSession();
    clearPlatformSession();
    setShowUserMenu(false);
    router.push("/");
  }

  function goTo(path: string) {
    setShowUserMenu(false);
    router.push(path);
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 z-40 ${gradient ? '' : 'bg-white border-b border-slate-200'}`}
      style={
        gradient
          ? {
              backgroundImage: 'var(--club-bg-gradient-inverted)',
              backgroundAttachment: 'fixed',
              backgroundSize: '100vw 100vh',
              backgroundPosition: '0 0',
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between h-full pr-3">
        {/* Left Section: Menu Button + App Name */}
        <div className="flex items-center gap-4">
          <div className="w-16 flex-shrink-0 flex justify-center">
            <button
              type="button"
              onClick={onMenuClick}
              className={`p-2 rounded-md transition-colors ${gradient ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className={`w-5 h-5 ${gradient ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-slate-700'}`} />
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {clubLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(clubLogoUrl)}
                alt={clubName}
                className="h-8 w-8 rounded-full object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-blue-600">⚡</span>
            )}
            <h1 className={`text-lg font-bold ${gradient ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-slate-900'}`}>{clubName}</h1>
          </div>
        </div>

        {/* Center Section: Search */}
{/*         <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t("common.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div> */}

        {/* Right Section: Language, Notifications, User */}
        <div className="flex items-center gap-4">
          {/* Cambiar de cuenta/club (solo si hay más de una) */}
          {switcher && (switcher.cuentas?.length ?? 0) > 1 && (
            <ClubAccountSwitcher
              token={switcher.token}
              cuentas={switcher.cuentas}
              currentMembresiaId={switcher.currentMembresiaId}
            />
          )}

          {/* Search Icon (Mobile) */}
            <button
              type="button"
              className={`md:hidden p-2 rounded-md transition-colors ${gradient ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}
              aria-label={t("common.searchPlaceholder")}
            >
            <MagnifyingGlassIcon className={`w-5 h-5 ${gradient ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-slate-700'}`} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className={`relative p-2 rounded-md transition-colors ${gradient ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}
              aria-label={t("notifications.title")}
            >
              <BellIcon className={`w-5 h-5 ${gradient ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-slate-700'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                  <h2 className="text-sm font-semibold text-white">
                    {t("notifications.title")}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={markAllRead}
                      className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                      aria-label={t("notifications.markAllRead")}
                      title={t("notifications.markAllRead")}
                    >
                      <Cog6ToothIcon className="w-4 h-4 text-slate-300" />
                    </button>
                    <div className="p-1.5 bg-red-500 rounded-full">
                      <BellIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-400 text-center">
                      {t("notifications.empty")}
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => !notification.leido && markOneRead(notification.id)}
                        className="flex w-full gap-3 px-4 py-3 border-b border-slate-700/60 last:border-b-0 hover:bg-slate-700/40 transition-colors text-left"
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            notification.leido ? "bg-transparent" : "bg-blue-400"
                          }`}
                        ></span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {notification.titulo}
                          </p>
                          <p className="text-sm text-slate-300 mt-0.5 line-clamp-2">
                            {notification.mensaje}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {timeAgo(notification.created_at, lang)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 p-2 rounded-md transition-colors ${gradient ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {userInitial}
              </div>
              <span className={`hidden sm:inline text-sm font-medium ${gradient ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-slate-700'}`}>
                {userName}
              </span>
              <ChevronDownIcon className={`w-4 h-4 ${gradient ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-slate-500'}`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-50">
                <button
                  onClick={() => goTo(configHref)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {t("common.settings", "Configuración")}
                </button>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  {t("common.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
