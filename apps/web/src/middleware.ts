import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const privatePrefix = '/supercalifragilisticoespiralidoso';
  const adminPrefix = `${privatePrefix}/gestion`;
  const publicAdminRoutes = ['/dashboard', '/actividades', '/espacios', '/socios', '/noticias', '/cobros', '/usuarios', '/liquidaciones'];
  if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/dashboard${pathname.slice(adminPrefix.length)}`;
    return NextResponse.redirect(url);
  }
  const publicAdminRoute = publicAdminRoutes.find((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (publicAdminRoute) {
    const suffix = pathname.slice(publicAdminRoute.length);
    const internalPath = publicAdminRoute === '/dashboard' ? '/gestion' : `/gestion${publicAdminRoute}${suffix}`;
    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/gestion${pathname.slice('/dashboard'.length)}`;
    return NextResponse.rewrite(url);
  }
  if (pathname === privatePrefix) {
    return NextResponse.redirect(new URL('/supercalifragilisticoespiralidoso/acceso', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
