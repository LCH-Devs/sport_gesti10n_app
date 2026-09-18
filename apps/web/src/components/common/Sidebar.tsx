"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  HomeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  BuildingLibraryIcon,
  ClockIcon,
  NewspaperIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "@/lib/useTranslation";

interface SidebarProps {
  isOpen?: boolean;
  variant?: "club" | "superadmin";
  gradient?: boolean;
}

export function Sidebar({ isOpen = true, variant = "club", gradient }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const clubMenuItems = [
    { icon: HomeIcon, label: t("nav.home"), href: "/dashboard" },
    { icon: UsersIcon, label: t("nav.socios"), href: "/socios" },
    { icon: CurrencyDollarIcon, label: t("nav.cobros"), href: "/cobros" },
    { icon: UserCircleIcon, label: t("nav.usuarios"), href: "/usuarios" },
    { icon: BuildingLibraryIcon, label: t("nav.espacios"), href: "/espacios" },
    { icon: ClockIcon, label: t("nav.actividades"), href: "/actividades" },
    { icon: NewspaperIcon, label: t("nav.noticias"), href: "/noticias" },
    { icon: CalendarDaysIcon, label: t("nav.eventos", "Eventos"), href: "/eventos" },
    { icon: BanknotesIcon, label: t("nav.liquidaciones"), href: "/liquidaciones" },
  ];

  const menuItems =
    variant === "superadmin"
      ? [
          { icon: ChartBarIcon, label: t("nav.superadmin.overview", "Overview"), href: "/supercalifragilisticoespiralidoso/panel" },
          { icon: BuildingLibraryIcon, label: t("nav.superadmin.clubs", "Clubs"), href: "/supercalifragilisticoespiralidoso/entidades" },
          { icon: UserGroupIcon, label: t("nav.superadmin.admins", "Administradores"), href: "/supercalifragilisticoespiralidoso/usuarios" },
          { icon: BanknotesIcon, label: t("nav.superadmin.plans", "Planes"), href: "/supercalifragilisticoespiralidoso/panel/planes" },
        ]
      : clubMenuItems;

  return (
    <aside
      className={`${isOpen ? "w-48" : "w-16"} mt-16 border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300 ${gradient ? "" : "bg-slate-50"}`}
      style={
        gradient
          ? {
              backgroundImage: "var(--club-bg-gradient-inverted)",
              backgroundAttachment: "fixed",
              backgroundSize: "100vw 100vh",
              backgroundPosition: "0 0",
            }
          : undefined
      }
    >
      <nav className="flex-1 px-3 py-2">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 py-2 rounded-md text-sm font-medium mb-2 transition-colors ${
                isOpen ? "justify-start px-3" : "justify-center px-0"
              } ${
                isActive
                  ? "bg-blue-600 text-white"
                  : gradient
                    ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] hover:bg-white/20"
                    : "text-slate-700 hover:bg-slate-200"
              }`}
              aria-current={isActive ? 'page' : undefined}
              title={isOpen ? undefined : item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
