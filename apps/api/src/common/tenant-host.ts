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

export function slugFromOrigin(
  originOrUrl: string | undefined | null,
  baseDomain?: string,
): string | null {
  if (!originOrUrl) return null;
  try {
    const u = new URL(originOrUrl);
    return parseTenantHost(u.host, baseDomain).slug;
  } catch {
    return parseTenantHost(originOrUrl, baseDomain).slug;
  }
}

export function tenantBaseFromWebUrl(webAppUrl: string): string {
  try {
    const host = new URL(webAppUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'localhost' || host.endsWith('.localhost')) return 'localhost';
    return host;
  } catch {
    return 'localhost';
  }
}

/** URL de login del club: subdominio, o path si WEB_APP_URL es una IP. */
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

export function isAllowedBrowserOrigin(
  origin: string,
  extraOrigins: string[],
  baseDomain?: string,
): boolean {
  if (extraOrigins.includes('*') || extraOrigins.includes(origin)) {
    return true;
  }
  try {
    const u = new URL(origin);
    const parsed = parseTenantHost(u.host, baseDomain);
    if (parsed.slug) return true;
    const host = u.hostname.toLowerCase();
    if (baseDomain) {
      const base = baseDomain.toLowerCase();
      if (host === base || host === `www.${base}`) return true;
    }
    if (host === 'localhost' || host.endsWith('.localhost')) return true;
    return false;
  } catch {
    return false;
  }
}
