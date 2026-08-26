import { NextRequest } from 'next/server';
import { runTenantMiddleware } from '@/lib/tenant-routing';

export function middleware(request: NextRequest) {
  return runTenantMiddleware(request, {
    loginPath: '/acceso',
    landingPath: '/inicio',
    homePath: '/panel',
    platformPrefixes: [
      '/panel',
      '/entidades',
      '/usuarios',
      '/novedades',
      '/eventos',
    ],
    clubPrefixes: ['/gestion'],
    memberPrefixes: ['/miembro'],
    chooserPath: '/ingreso',
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
