import { NextRequest } from 'next/server';
import { runTenantMiddleware } from '@/lib/tenant-routing';

export function middleware(request: NextRequest) {
  return runTenantMiddleware(request, {
    loginPath: '/login',
    landingPath: '/landing',
    homePath: '/dashboard',
    platformPrefixes: ['/dashboard', '/clubs', '/users', '/news', '/events'],
    clubPrefixes: ['/admin'],
    memberPrefixes: ['/socio'],
    chooserPath: '/entrar',
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
