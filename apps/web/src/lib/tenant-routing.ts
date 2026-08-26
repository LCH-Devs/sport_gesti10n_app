import { NextRequest, NextResponse } from 'next/server';
import {
  clubLoginUrl,
  isPlatformHost,
  parseTenantHost,
  platformOrigin,
} from './tenant-host';

export function apexOriginFrom(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_WEB_URL;
  if (configured) return configured.replace(/\/$/, '');
  const { protocol, port } = request.nextUrl;
  const portPart =
    port && port !== '80' && port !== '443' ? `:${port}` : '';
  return `${protocol}//localhost${portPart}`;
}

export function tenantBaseDomain(host: string): string | undefined {
  const env = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
  if (env) return env;
  if (
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host.includes('.localhost')
  ) {
    return 'localhost';
  }
  return undefined;
}

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isExactOrChild(pathname: string, base: string) {
  return !!base && (pathname === base || pathname.startsWith(`${base}/`));
}

export function runTenantMiddleware(
  request: NextRequest,
  opts: {
    loginPath: string;
    landingPath: string;
    homePath: string;
    platformPrefixes: string[];
    clubPrefixes: string[];
    memberPrefixes?: string[];
    chooserPath?: string;
  },
) {
  const loginPath = opts.loginPath.replace(/\/$/, '') || '/login';
  const landingPath = opts.landingPath.replace(/\/$/, '') || '/landing';
  const chooserPath = opts.chooserPath?.replace(/\/$/, '') || '';
  const memberPrefixes = opts.memberPrefixes || [];
  const host = request.headers.get('host') || '';
  const base = tenantBaseDomain(host);
  const { slug } = parseTenantHost(host, base);
  const platform = isPlatformHost(host, base);
  const { pathname, search } = request.nextUrl;
  const web = process.env.NEXT_PUBLIC_WEB_URL || apexOriginFrom(request);
  const apex = apexOriginFrom(request);
  const platformBase = platformOrigin(web, base);
  const escaped = loginPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nestedRe = new RegExp(`^${escaped}/([^/]+)/?$`);

  if (slug) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.redirect(
        new URL(chooserPath || loginPath, request.url),
      );
    }
    if (pathname === loginPath || pathname === `${loginPath}/`) {
      const url = request.nextUrl.clone();
      url.pathname = `${loginPath}/${slug}`;
      return NextResponse.rewrite(url);
    }
    const nested = pathname.match(nestedRe);
    if (nested?.[1] && nested[1] !== slug) {
      return NextResponse.redirect(
        clubLoginUrl(nested[1], web, base, loginPath),
      );
    }
    if (isExactOrChild(pathname, landingPath)) {
      return NextResponse.redirect(`${apex}${pathname}${search}`);
    }
    if (matchesPrefix(pathname, opts.platformPrefixes)) {
      return NextResponse.redirect(`${platformBase}${pathname}${search}`);
    }
    return NextResponse.next();
  }

  if (platform) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
    if (isExactOrChild(pathname, landingPath)) {
      return NextResponse.redirect(`${apex}${pathname}${search}`);
    }
    if (chooserPath && isExactOrChild(pathname, chooserPath)) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
    if (
      matchesPrefix(pathname, opts.clubPrefixes) ||
      matchesPrefix(pathname, memberPrefixes)
    ) {
      return NextResponse.redirect(`${platformBase}${opts.homePath}`);
    }
    const nested = pathname.match(nestedRe);
    if (nested?.[1]) {
      return NextResponse.redirect(clubLoginUrl(nested[1], web, base, loginPath));
    }
    return NextResponse.next();
  }

  // Apex: marketing + login único. Superadmin vive en platform.*
  if (pathname === loginPath || pathname === `${loginPath}/`) {
    return NextResponse.redirect(`${platformBase}${loginPath}`);
  }
  if (matchesPrefix(pathname, opts.platformPrefixes)) {
    return NextResponse.redirect(`${platformBase}${pathname}${search}`);
  }
  if (matchesPrefix(pathname, opts.clubPrefixes)) {
    return NextResponse.redirect(
      `${apex}${chooserPath || landingPath}`,
    );
  }
  const nested = pathname.match(nestedRe);
  if (nested?.[1]) {
    return NextResponse.redirect(clubLoginUrl(nested[1], web, base, loginPath));
  }
  return NextResponse.next();
}
