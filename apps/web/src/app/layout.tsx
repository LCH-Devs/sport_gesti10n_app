'use client';

import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Navbar, Sidebar } from '@/components/common';
import { LanguageProvider } from '@/lib/LanguageContext';
import { DateTimeFormatProvider } from '@/lib/DateTimeFormatContext';
import { ChromeProvider, useChrome } from '@/lib/ChromeContext';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { applyClubTheme, getSession, getSocioSession } from '@/lib/api';

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
    pathname === '/supercalifragilisticoespiralidoso/acceso' ||
    pathname.startsWith('/supercalifragilisticoespiralidoso/plan/confirmar');
  const isPrefixedRoute = pathname.startsWith('/supercalifragilisticoespiralidoso/');
  const isOnboarding = pathname.startsWith('/gestion/onboarding');
  const isCambiarClave = pathname.startsWith('/gestion/cambiar-clave');
  // El portal del socio tiene su propia página completa (perfil, cuotas,
  // reservas) y no debe mostrar el menú de comisión (Socios, Cobros,
  // Usuarios...): confundiría sobre qué puede hacer un socio.
  // OJO: "startsWith('/socio')" solo (sin el "/" final) también matchea
  // "/socios" — la sección de gestión de socios del staff — y le hacía
  // desaparecer el navbar/sidebar. Hay que exigir el límite de ruta.
  const isMemberPortalRoute =
    pathname === '/socio' ||
    pathname.startsWith('/socio/') ||
    pathname === '/profe' ||
    pathname.startsWith('/profe/');
  // Se resuelve por pathname (no solo por el estado de ChromeContext) para que
  // el navbar/sidebar no parpadeen en el primer render de un hard reload,
  // antes de que el efecto de la página llame a setHideChrome.
  const showNavbarSidebar =
    !isPublicPage && !hideChrome && !isOnboarding && !isCambiarClave && !isMemberPortalRoute;
  const showClubBackground = !isPublicPage && !isPrefixedRoute && !isOnboarding;

  React.useEffect(() => {
    if (isPublicPage || isPrefixedRoute) return;
    if (isMemberPortalRoute) {
      const socioSession = getSocioSession();
      if (!socioSession) return;
      applyClubTheme(socioSession.club);
      if (
        socioSession.must_change_password &&
        !pathname.startsWith('/socio/cambiar-clave')
      ) {
        router.replace('/socio/cambiar-clave');
      }
      return;
    }
    const s = getSession();
    if (!s) return;
    applyClubTheme(s.club);
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
  }, [pathname, isPublicPage, isPrefixedRoute, isMemberPortalRoute, router]);

  return (
    <>
      {showNavbarSidebar && (
        <Navbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          gradient={showClubBackground}
        />
      )}

      <div className={showNavbarSidebar ? 'flex' : ''}>
        {showNavbarSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            variant={isPrefixedRoute ? 'superadmin' : 'club'}
            gradient={showClubBackground}
          />
        )}

        <main
          className={
            showNavbarSidebar
              ? 'flex-1 overflow-auto max-h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] mt-16'
              : 'min-h-screen'
          }
        >
          {children}
        </main>
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
          <DateTimeFormatProvider>
            <ChromeProvider>
              <RootLayoutContent>{children}</RootLayoutContent>
            </ChromeProvider>
          </DateTimeFormatProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
