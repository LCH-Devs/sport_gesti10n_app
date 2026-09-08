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
