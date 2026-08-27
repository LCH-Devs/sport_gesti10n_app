'use client';

import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Navbar, Sidebar } from '@/components/common';
import { LanguageProvider } from '@/lib/LanguageContext';
import React from 'react';
import { usePathname } from 'next/navigation';

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const pathname = usePathname();

  const isPublicPage =
    pathname === '/landing' ||
    pathname === '/' ||
    pathname.startsWith('/login');
  const showNavbarSidebar = !isPublicPage;

  return (
    <>
      {showNavbarSidebar && (
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      )}

      <div className={showNavbarSidebar ? 'flex' : ''}>
        {showNavbarSidebar && (
          <Sidebar isOpen={sidebarOpen} />
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
          <RootLayoutContent>{children}</RootLayoutContent>
        </LanguageProvider>
      </body>
    </html>
  );
}
