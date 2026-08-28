'use client';

import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Navbar, Sidebar } from '@/components/common';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ChromeProvider, useChrome } from '@/lib/ChromeContext';
import React from 'react';
import { usePathname } from 'next/navigation';

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const pathname = usePathname();
  const { hideChrome } = useChrome();

  const isPublicPage =
    pathname === '/' ||
    pathname === '/landing' ||
    pathname.startsWith('/login') ||
    pathname === '/supercalifragilisticoespiralidoso/acceso';
  const isPrefixedRoute = pathname.startsWith('/supercalifragilisticoespiralidoso/');
  const showNavbarSidebar = !isPublicPage && !hideChrome;

  return (
    <>
      {showNavbarSidebar && (
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      )}

      <div className={showNavbarSidebar ? 'flex' : ''}>
        {showNavbarSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            variant={isPrefixedRoute ? 'superadmin' : 'club'}
          />
        )}

        <main className={showNavbarSidebar ? 'flex-1 overflow-auto max-h-[calc(100vh-4rem)] mt-16' : ''}>{children}</main>
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Sports Management System</title>
        <meta name="description" content="Multi-institutional sports club management platform" />
      </head>
      <body className="bg-slate-50">
        <LanguageProvider>
          <ChromeProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
          </ChromeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
