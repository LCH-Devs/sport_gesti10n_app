'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  ChartBarIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  CalendarIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { icon: ChartBarIcon, label: 'Overview', href: '/dashboard' },
  { icon: BuildingLibraryIcon, label: 'Clubs', href: '/clubs' },
  { icon: UserGroupIcon, label: 'Members', href: '/users' },
  { icon: CalendarIcon, label: 'Events', href: '/events' },
  { icon: NewspaperIcon, label: 'News', href: '/news' },
];

interface SidebarProps {
  isOpen?: boolean;
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-16'} bg-slate-50 border-r border-slate-200 flex flex-col h-screen transition-all duration-300`}>
      {/* Logo */}
    {/*   <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          AthlletiCorp
        </h2>
        <p className="text-xs text-slate-600 mt-1">Super Admin</p>
      </div> */}

      {/* Menu */}
      <nav className="flex-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium mb-2 transition-colors justify-center ${
                isOpen ? 'justify-start' : ''
              } ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
              title={isOpen ? undefined : item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="px-6 py-4 border-t border-slate-200 space-y-2">
          <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <span>Quick Action</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors text-sm">
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span>Help Center</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors text-sm">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
