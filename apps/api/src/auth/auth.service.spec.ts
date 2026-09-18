import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginAttemptService } from './login-attempt.service';
import { PrismaService } from '../prisma/prisma.service';
import { JWT_EXPIRES_SECONDS } from './auth-security';

const club = {
  id: 1,
  slug: 'club-prueba',
  activo: true,
  nombre: 'Club Prueba',
  color_primario: '#2563eb',
  color_secundario: null,
  color_terciario: null,
  logo_url: null,
  cuota_monto: 5000,
  onboarding_completo: true,
  eliminado: false,
};

const membresiaSocio = {
  id: 9,
  rol: 'socio',
  es_socio: true,
  estado: 'activo',
  must_change_password: false,
  club,
};

describe('AuthService.login', () => {
  const prisma = {
    usuario: { findUnique: jest.fn() },
    membresia: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token-socio') };
  const config = { get: jest.fn() };
  const loginAttempts = {
    assertNotLocked: jest.fn(),
    recordFailure: jest.fn(),
    recordSuccess: jest.fn(),
  };
  let auth: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('token-socio');
    config.get.mockReturnValue('');
    loginAttempts.assertNotLocked.mockReset();
    loginAttempts.recordFailure.mockReset();
    loginAttempts.recordSuccess.mockReset();
    auth = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      loginAttempts as unknown as LoginAttemptService,
      { avisarAdmins: jest.fn().mockResolvedValue(undefined) } as any,
    );
  });

  it('rechaza email inexistente y cuenta el fallo', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(
      auth.login({
        email: 'juan@test.com',
        password: 'socio123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(loginAttempts.recordFailure).toHaveBeenCalledWith('juan@test.com');
    expect(loginAttempts.recordSuccess).not.toHaveBeenCalled();
  });

  it('si el email está bloqueado, no consulta la DB', async () => {
    loginAttempts.assertNotLocked.mockImplementation(() => {
      throw new HttpException('bloqueado', HttpStatus.TOO_MANY_REQUESTS);
    });
    try {
      await auth.login({
        email: 'juan@test.com',
        password: 'socio123',
      });
      fail('debía lanzar 429');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('sin slug, emite JWT del único club', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 3,
      email: 'juan@test.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '30111222',
      password_hash: 'hash',
      membresias: [membresiaSocio],
    });
    const bcrypt = await import('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await auth.login({
      email: 'juan@test.com',
      password: 'socio123',
    });

    expect(result).toHaveProperty('access_token', 'token-socio');
    expect(result).toHaveProperty('expires_in', JWT_EXPIRES_SECONDS);
    expect(result).toHaveProperty('role', 'socio');
    expect(result).toHaveProperty('es_socio', true);
    expect(result.socio?.email).toBe('juan@test.com');
    expect(loginAttempts.recordSuccess).toHaveBeenCalledWith('juan@test.com');
  });

  it('un profesor contratado recibe acceso de profe pero no de socio', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 4,
      email: 'profe@test.com',
      nombre: 'Pablo',
      apellido: 'Profe',
      dni: '30333444',
      password_hash: 'hash',
      membresias: [
        { ...membresiaSocio, id: 12, rol: 'profe', es_socio: false },
      ],
    });
    const bcrypt = await import('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await auth.login({
      email: 'profe@test.com',
      password: 'profe123',
    });

    expect(result.role).toBe('profe');
    expect(result.es_socio).toBe(false);
    expect(result.socio?.es_socio).toBe(false);
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'profe', es_socio: false }),
    );
  });

  it('sin slug, si hay varios clubes entra a uno y arma el switcher', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 3,
      email: 'juan@test.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '30111222',
      password_hash: 'hash',
      membresias: [
        membresiaSocio,
        {
          ...membresiaSocio,
          id: 10,
          club: { ...club, id: 2, slug: 'otro', nombre: 'Otro' },
        },
      ],
    });
    const bcrypt = await import('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await auth.login({
      email: 'juan@test.com',
      password: 'socio123',
    });

    expect(result).toHaveProperty('access_token', 'token-socio');
    expect(result.cuentas).toEqual([
      expect.objectContaining({ club: expect.objectContaining({ slug: 'club-prueba' }) }),
      expect.objectContaining({ club: expect.objectContaining({ slug: 'otro' }) }),
    ]);
  });

  it('en local la pass maestra entra a un admin y marca impersonación', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'PLATFORM_MASTER_PASSWORD') return 'clubapp-master-dev';
      if (key === 'NODE_ENV') return 'development';
      return '';
    });
    prisma.usuario.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@clubprueba.com',
      nombre: 'Ana',
      apellido: 'Admin',
      dni: '20111222',
      password_hash: 'hash',
      membresias: [{ ...membresiaSocio, id: 2, rol: 'admin' }],
    });

    const result = await auth.login({
      email: 'admin@clubprueba.com',
      password: 'clubapp-master-dev',
    });

    expect(result.impersonated_by_platform).toBe(true);
    expect(result.role).toBe('admin');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ impersonated_by_platform: true }),
    );
  });

  it('en production la pass maestra no abre sesión', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'PLATFORM_MASTER_PASSWORD') return 'clubapp-master-dev';
      if (key === 'NODE_ENV') return 'production';
      return '';
    });
    prisma.usuario.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@clubprueba.com',
      nombre: 'Ana',
      apellido: 'Admin',
      dni: '20111222',
      password_hash: 'hash',
      membresias: [{ ...membresiaSocio, id: 2, rol: 'admin' }],
    });
    const bcrypt = await import('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      auth.login({
        email: 'admin@clubprueba.com',
        password: 'clubapp-master-dev',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
