"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  ChartBarIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  CalendarIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  { icon: ChartBarIcon, label: "Overview", href: "/panel" },
  { icon: BuildingLibraryIcon, label: "Clubs", href: "/entidades" },
  { icon: UserGroupIcon, label: "Members", href: "/usuarios" },
  { icon: CalendarIcon, label: "Events", href: "/eventos" },
  { icon: NewspaperIcon, label: "News", href: "/novedades" },
];

interface SidebarProps {
  isOpen?: boolean;
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${isOpen ? "w-48" : "w-16"} mt-16 bg-slate-50 border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300`}
    >
      <nav className="flex-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
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
                  : "text-slate-700 hover:bg-slate-200"
              }`}
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
