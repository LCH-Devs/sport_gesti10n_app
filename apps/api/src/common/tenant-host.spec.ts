import {
  clubLoginUrl,
  corsAllowlistFromEnv,
  isAllowedBrowserOrigin,
  isPlatformHost,
  isReservedTenantSlug,
  parseTenantHost,
  platformOrigin,
  slugFromOrigin,
  staffPanelLoginUrl,
} from './tenant-host';

describe('parseTenantHost', () => {
  it('apex localhost no es tenant', () => {
    expect(parseTenantHost('localhost:3000').slug).toBeNull();
  });

  it('club-prueba.localhost es tenant', () => {
    expect(parseTenantHost('club-prueba.localhost:3000').slug).toBe(
      'club-prueba',
    );
  });

  it('subdominios reservados no son tenant', () => {
    expect(parseTenantHost('api.localhost:3000').slug).toBeNull();
    expect(parseTenantHost('platform.localhost').slug).toBeNull();
  });

  it('usa TENANT_BASE_DOMAIN en producción', () => {
    expect(
      parseTenantHost('club-prueba.clubapp.com.ar', 'clubapp.com.ar').slug,
    ).toBe('club-prueba');
    expect(parseTenantHost('clubapp.com.ar', 'clubapp.com.ar').slug).toBeNull();
    expect(parseTenantHost('www.clubapp.com.ar', 'clubapp.com.ar').slug).toBeNull();
    expect(parseTenantHost('api.clubapp.com.ar', 'clubapp.com.ar').slug).toBeNull();
  });
});

describe('staffPanelLoginUrl', () => {
  it('usa el origin del panel, sin slug', () => {
    expect(staffPanelLoginUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/login',
    );
    expect(staffPanelLoginUrl('https://clubapp.com.ar/')).toBe(
      'https://clubapp.com.ar/login',
    );
  });
});

describe('clubLoginUrl', () => {
  it('arma subdominio en local', () => {
    expect(clubLoginUrl('club-prueba', 'http://localhost:3000')).toBe(
      'http://club-prueba.localhost:3000/login',
    );
  });

  it('arma subdominio en producción', () => {
    expect(
      clubLoginUrl(
        'club-prueba',
        'https://clubapp.com.ar',
        'clubapp.com.ar',
      ),
    ).toBe('https://club-prueba.clubapp.com.ar/login');
  });

  it('si WEB_APP_URL es IP, usa path', () => {
    expect(clubLoginUrl('club-prueba', 'http://203.0.113.10')).toBe(
      'http://203.0.113.10/login/club-prueba',
    );
  });
});

describe('platform host', () => {
  it('detecta platform.localhost', () => {
    expect(isPlatformHost('platform.localhost:3000')).toBe(true);
    expect(isPlatformHost('localhost:3000')).toBe(false);
    expect(isPlatformHost('club-prueba.localhost:3000')).toBe(false);
  });

  it('arma el origin del superadmin', () => {
    expect(platformOrigin('http://localhost:3000')).toBe(
      'http://platform.localhost:3000',
    );
    expect(platformOrigin('https://clubapp.com.ar', 'clubapp.com.ar')).toBe(
      'https://platform.clubapp.com.ar',
    );
  });
});

describe('slugFromOrigin / CORS', () => {
  it('lee el slug del Origin', () => {
    expect(slugFromOrigin('http://club-a.localhost:3000')).toBe('club-a');
  });

  it('permite origen de tenant aunque no esté en CORS_ORIGIN', () => {
    expect(
      isAllowedBrowserOrigin(
        'http://club-prueba.localhost:3000',
        ['http://localhost:3000'],
        'localhost',
      ),
    ).toBe(true);
  });

  it('rechaza un origin ajeno', () => {
    expect(
      isAllowedBrowserOrigin(
        'https://evil.example',
        ['http://localhost:3000'],
        'clubapp.com.ar',
      ),
    ).toBe(false);
  });

  it('si CORS_ORIGIN está vacío, usa WEB_APP_URL o localhost', () => {
    expect(corsAllowlistFromEnv('', 'http://localhost:3000')).toEqual([
      'http://localhost:3000',
    ]);
    expect(corsAllowlistFromEnv(undefined, undefined)).toEqual([
      'http://localhost:3000',
    ]);
    expect(
      corsAllowlistFromEnv('http://localhost:3000,http://127.0.0.1:3000'),
    ).toEqual(['http://localhost:3000', 'http://127.0.0.1:3000']);
  });
});

describe('isReservedTenantSlug', () => {
  it('marca api/www/platform', () => {
    expect(isReservedTenantSlug('api')).toBe(true);
    expect(isReservedTenantSlug('www')).toBe(true);
    expect(isReservedTenantSlug('club-prueba')).toBe(false);
  });
});
