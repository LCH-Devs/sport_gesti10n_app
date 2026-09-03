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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  clearPlatformSession,
  clearSession,
  clearSocioSession,
  getPlatformSession,
  getSession,
  getSocioSession,
  mediaUrl,
} from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

interface NavbarProps {
  onMenuClick?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Nueva reserva confirmada",
    description: "Se confirmó una reserva de cancha para hoy a las 18:00.",
    timeAgo: "hace 13 horas",
    read: false,
  },
  {
    id: "2",
    title: "Pago recibido",
    description: "Un socio abonó la cuota mensual correspondiente a este mes.",
    timeAgo: "hace 16 horas",
    read: false,
  },
  {
    id: "3",
    title: "Nueva actividad creada",
    description: "Se agregó una nueva actividad al calendario del club.",
    timeAgo: "hace 1 día",
    read: false,
  },
  {
    id: "4",
    title: "Solicitud de socio pendiente",
    description: "Hay una nueva solicitud de alta esperando aprobación.",
    timeAgo: "hace 4 días",
    read: true,
  },
];

export function Navbar({ onMenuClick }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const [clubName, setClubName] = React.useState("Kanri");
  const [clubLogoUrl, setClubLogoUrl] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState("User");
  const [profileHref, setProfileHref] = React.useState(
    "/gestion/config?tab=perfil",
  );
  const [preferencesHref, setPreferencesHref] = React.useState(
    "/gestion/config?tab=preferencias",
  );
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

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
        setProfileHref("/supercalifragilisticoespiralidoso/panel/perfil");
        setPreferencesHref(
          "/supercalifragilisticoespiralidoso/panel/preferencias",
        );
      } else {
        setClubName(session?.club.nombre || "Kanri");
        setClubLogoUrl(session?.club.logo_url || null);
        setUserName(session?.admin.nombre || socioSession?.socio.nombre || "User");
        setProfileHref("/gestion/config?tab=perfil");
        setPreferencesHref("/gestion/config?tab=preferencias");
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40">
      <div className="flex items-center justify-between h-full pr-3">
        {/* Left Section: Menu Button + App Name */}
        <div className="flex items-center gap-4">
          <div className="w-16 flex-shrink-0 flex justify-center">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5 text-slate-700" />
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
            <h1 className="text-lg font-bold text-slate-900">{clubName}</h1>
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
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Search Icon (Mobile) */}
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-md transition-colors">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-700" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 hover:bg-slate-100 rounded-md transition-colors"
              aria-label={t("notifications.title")}
            >
              <BellIcon className="w-5 h-5 text-slate-700" />
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
                      <div
                        key={notification.id}
                        className="flex gap-3 px-4 py-3 border-b border-slate-700/60 last:border-b-0 hover:bg-slate-700/40 transition-colors"
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            notification.read ? "bg-transparent" : "bg-blue-400"
                          }`}
                        ></span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-300 mt-0.5 line-clamp-2">
                            {notification.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {notification.timeAgo}
                          </p>
                        </div>
                      </div>
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
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {userInitial}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700">
                {userName}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-slate-500" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-50">
                <button
                  onClick={() => goTo(profileHref)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {t("common.profileSettings")}
                </button>
                <button
                  onClick={() => goTo(preferencesHref)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {t("common.preferences")}
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
