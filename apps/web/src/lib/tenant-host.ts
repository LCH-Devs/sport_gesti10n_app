export const RESERVED_TENANT_SLUGS = [
  'www',
  'api',
  'app',
  'platform',
  'admin',
  'mail',
  'login',
  'acceso',
  'dashboard',
  'panel',
  'static',
  'cdn',
  'ftp',
  'ns1',
  'ns2',
  'smtp',
  'webmail',
  'portal',
] as const;

const RESERVED = new Set<string>(RESERVED_TENANT_SLUGS);

export const PLATFORM_SUBDOMAIN = 'platform';

export function isReservedTenantSlug(slug: string): boolean {
  return RESERVED.has(slug.toLowerCase().trim());
}

export function hostnameOf(hostHeader: string): string {
  return hostHeader.trim().split(':')[0].toLowerCase();
}

export function parseTenantHost(
  hostHeader: string | undefined | null,
  baseDomain?: string,
): { slug: string | null; hostname: string } {
  if (!hostHeader?.trim()) {
    return { slug: null, hostname: '' };
  }
  const hostname = hostnameOf(hostHeader);
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return { slug: null, hostname };
  }

  if (hostname.endsWith('.localhost')) {
    const slug = hostname.slice(0, -'.localhost'.length);
    if (!slug || slug.includes('.') || isReservedTenantSlug(slug)) {
      return { slug: null, hostname };
    }
    return { slug, hostname };
  }

  const base = (baseDomain || '')
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/^\./, '');
  if (base) {
    if (hostname === base || hostname === `www.${base}`) {
      return { slug: null, hostname };
    }
    const suffix = `.${base}`;
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      if (sub && !sub.includes('.') && !isReservedTenantSlug(sub)) {
        return { slug: sub, hostname };
      }
    }
  }

  return { slug: null, hostname };
}

export function clubLoginUrl(
  slug: string,
  webAppUrl: string,
  tenantBaseDomain?: string,
  loginPath = '/login',
): string {
  const path = loginPath.startsWith('/') ? loginPath : `/${loginPath}`;
  let web: URL;
  try {
    web = new URL(webAppUrl);
  } catch {
    return `${webAppUrl.replace(/\/$/, '')}${path}/${slug}`;
  }

  const host = web.hostname.toLowerCase();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return `${web.origin}${path}/${slug}`;
  }

  const port = web.port ? `:${web.port}` : '';
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return `${web.protocol}//${slug}.localhost${port}${path}`;
  }

  const base = (
    tenantBaseDomain || host.replace(/^www\./, '')
  ).toLowerCase();
  return `${web.protocol}//${slug}.${base}${port}${path}`;
}

/** URL en el host del club (panel socio, etc.). En IP usa ?club=. */
export function clubTenantUrl(
  slug: string,
  webAppUrl: string,
  tenantBaseDomain?: string,
  path = '/',
): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  let web: URL;
  try {
    web = new URL(webAppUrl);
  } catch {
    const joiner = normalized.includes('?') ? '&' : '?';
    return `${webAppUrl.replace(/\/$/, '')}${normalized}${joiner}club=${encodeURIComponent(slug)}`;
  }

  const host = web.hostname.toLowerCase();
  const port = web.port ? `:${web.port}` : '';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const joiner = normalized.includes('?') ? '&' : '?';
    return `${web.origin}${normalized}${joiner}club=${encodeURIComponent(slug)}`;
  }
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return `${web.protocol}//${slug}.localhost${port}${normalized}`;
  }
  const base = (
    tenantBaseDomain || host.replace(/^www\./, '')
  ).toLowerCase();
  return `${web.protocol}//${slug}.${base}${port}${normalized}`;
}

export function isPlatformHost(
  hostHeader: string | undefined | null,
  baseDomain?: string,
): boolean {
  if (!hostHeader?.trim()) return false;
  const hostname = hostnameOf(hostHeader);
  if (hostname === `${PLATFORM_SUBDOMAIN}.localhost`) return true;
  const base = (baseDomain || '')
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/^\./, '');
  return !!base && hostname === `${PLATFORM_SUBDOMAIN}.${base}`;
}

export function platformOrigin(
  webAppUrl: string,
  tenantBaseDomain?: string,
): string {
  let web: URL;
  try {
    web = new URL(webAppUrl);
  } catch {
    return webAppUrl.replace(/\/$/, '');
  }
  const host = web.hostname.toLowerCase();
  const port = web.port ? `:${web.port}` : '';
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return `${web.protocol}//${PLATFORM_SUBDOMAIN}.localhost${port}`;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return web.origin;
  }
  const base = (
    tenantBaseDomain || host.replace(/^www\./, '')
  ).toLowerCase();
  return `${web.protocol}//${PLATFORM_SUBDOMAIN}.${base}${port}`;
}

export function clubAppUrlFromBrowser(slug: string, path: string): string {
  if (typeof window === 'undefined') return path;
  const web = process.env.NEXT_PUBLIC_WEB_URL || window.location.origin;
  const host = window.location.host;
  const env = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
  const base =
    env ||
    (host === 'localhost' ||
    host.startsWith('localhost:') ||
    host.includes('.localhost')
      ? 'localhost'
      : undefined);
  return clubTenantUrl(slug, web, base, path);
}

/** Mueve la sesión al host del club (localStorage es por origen). */
export function handoffSessionToClub(
  slug: string,
  nextPath: string,
  kind: 'admin' | 'socio',
  payload: unknown,
): boolean {
  if (typeof window === 'undefined') return false;
  const target = clubAppUrlFromBrowser(slug, '/sesion');
  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return false;
  }
  if (targetUrl.host === window.location.host) return false;
  const data = encodeURIComponent(JSON.stringify({ next: nextPath, kind, payload }));
  window.location.href = `${target}#${data}`;
  return true;
}
