'use client';

import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Navbar, Sidebar } from '@/components/common';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ChromeProvider, useChrome } from '@/lib/ChromeContext';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/api';

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { hideChrome } = useChrome();

  const isPublicPage =
    pathname === '/' ||
    pathname === '/landing' ||
    pathname.startsWith('/login') ||
    pathname === '/supercalifragilisticoespiralidoso/acceso';
  const isPrefixedRoute = pathname.startsWith('/supercalifragilisticoespiralidoso/');
  const showNavbarSidebar = !isPublicPage && !hideChrome;

  React.useEffect(() => {
    if (isPublicPage || isPrefixedRoute) return;
    const s = getSession();
    if (!s) return;
    if (s.must_complete_onboarding && !pathname.startsWith('/gestion/onboarding')) {
      router.replace('/gestion/onboarding');
      return;
    }
    if (
      s.must_change_password &&
      !s.must_complete_onboarding &&
      !pathname.startsWith('/gestion/cambiar-clave')
    ) {
      router.replace('/gestion/cambiar-clave');
    }
  }, [pathname, isPublicPage, isPrefixedRoute, router]);

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
    <html lang="es">
      <head>
        <title>Kanri</title>
        <meta name="description" content="Plataforma de gestión de clubes deportivos multi-institucional" />
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
