'use client';

import '@/app/globals.css';
import { Navbar, Sidebar } from '@/components/common';
import React from 'react';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const pathname = usePathname();

  const isLandingPage = pathname === '/landing' || pathname === '/';
  const showNavbarSidebar = !isLandingPage;

  return (
    <html lang="en">
      <head>
        <title>AthlletiCorp - Sports Management System</title>
        <meta name="description" content="Multi-institutional sports club management platform" />
      </head>
      <body className="bg-slate-50">
        {showNavbarSidebar && (
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} userName="Admin User" userInitial="A" />
        )}

        <div className={showNavbarSidebar ? 'flex h-screen pt-16' : ''}>
          {showNavbarSidebar && (
            <Sidebar isOpen={sidebarOpen} />
          )}

          <main className={showNavbarSidebar ? 'flex-1 overflow-auto' : ''}>{children}</main>
        </div>
      </body>
    </html>
  );
}
