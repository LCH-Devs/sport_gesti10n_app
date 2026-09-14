import { UnauthorizedException } from '@nestjs/common';
import { assertSesionViva } from './session-viva';
import { JwtPayload } from './jwt.strategy';

function clubPayload(over: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: 9,
    role: 'admin',
    club_id: 1,
    club_slug: 'club-prueba',
    user_id: 3,
    ...over,
  };
}

describe('assertSesionViva', () => {
  it('acepta membresía viva y pisa el rol desde la DB', async () => {
    const db = {
      membresia: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          rol: 'entrada',
          estado: 'activo',
          club_id: 1,
          usuario: { password_changed_at: new Date(0) },
        }),
      },
      platformAdmin: { findFirst: jest.fn() },
    };

    const out = await assertSesionViva(db, clubPayload({ role: 'admin' }));
    expect(out.role).toBe('entrada');
    expect(db.membresia.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 9,
          eliminado: false,
          club: { id: 1, eliminado: false, activo: true },
        }),
      }),
    );
  });

  it('rechaza un token firmado antes del último cambio de contraseña', async () => {
    const iat = Math.floor(Date.now() / 1000) - 3600; // token de hace 1h
    const db = {
      membresia: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          rol: 'admin',
          estado: 'activo',
          club_id: 1,
          // la contraseña cambió después de que se emitió el token
          usuario: { password_changed_at: new Date() },
        }),
      },
      platformAdmin: { findFirst: jest.fn() },
    };

    await expect(
      assertSesionViva(db, clubPayload({ iat })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('acepta un token firmado después del último cambio de contraseña', async () => {
    const iat = Math.floor(Date.now() / 1000);
    const db = {
      membresia: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          rol: 'admin',
          estado: 'activo',
          club_id: 1,
          usuario: { password_changed_at: new Date(0) },
        }),
      },
      platformAdmin: { findFirst: jest.fn() },
    };

    await expect(
      assertSesionViva(db, clubPayload({ iat })),
    ).resolves.toBeDefined();
  });

  it('rechaza membresía dada de baja o club inactivo', async () => {
    const db = {
      membresia: { findFirst: jest.fn().mockResolvedValue(null) },
      platformAdmin: { findFirst: jest.fn() },
    };
    await expect(assertSesionViva(db, clubPayload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('acepta platform admin activo', async () => {
    const db = {
      membresia: { findFirst: jest.fn() },
      platformAdmin: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, activo: true }),
      },
    };
    const out = await assertSesionViva(db, { sub: 1, role: 'platform' });
    expect(out.role).toBe('platform');
  });

  it('rechaza platform admin inactivo', async () => {
    const db = {
      membresia: { findFirst: jest.fn() },
      platformAdmin: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    await expect(
      assertSesionViva(db, { sub: 1, role: 'platform' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
