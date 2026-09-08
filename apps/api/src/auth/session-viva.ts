import { UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

export type SessionDb = {
  membresia: {
    findFirst: (args: unknown) => Promise<{
      id: number;
      rol: string;
      estado: string;
      club_id: number;
    } | null>;
  };
  platformAdmin: {
    findFirst: (args: unknown) => Promise<{ id: number; activo: boolean } | null>;
  };
};

/**
 * El JWT no se revoca al hacer baja: hay que mirar la DB en cada request.
 * Membresía eliminada, club inactivo/baja o admin de plataforma inactivo → 401.
 */
export async function assertSesionViva(
  db: SessionDb,
  payload: JwtPayload,
): Promise<JwtPayload> {
  if (payload.role === 'platform') {
    const admin = await db.platformAdmin.findFirst({
      where: { id: payload.sub, activo: true },
      select: { id: true, activo: true },
    });
    if (!admin) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return payload;
  }

  if (!payload.club_id || !payload.sub) {
    throw new UnauthorizedException('Sesión inválida');
  }

  const row = await db.membresia.findFirst({
    where: {
      id: payload.sub,
      eliminado: false,
      estado: { not: 'suspendido' },
      club: {
        id: payload.club_id,
        eliminado: false,
        activo: true,
      },
    },
    select: { id: true, rol: true, estado: true, club_id: true },
  });

  if (!row) {
    throw new UnauthorizedException('Sesión inválida');
  }

  return {
    ...payload,
    role: row.rol,
    club_id: row.club_id,
  };
}
