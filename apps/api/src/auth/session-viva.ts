import { UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

export type SessionDb = {
  membresia: {
    findFirst: (args: unknown) => Promise<{
      id: number;
      rol: string;
      es_socio: boolean;
      estado: string;
      club_id: number;
      usuario: { password_changed_at: Date };
    } | null>;
  };
  platformAdmin: {
    findFirst: (args: unknown) => Promise<{ id: number; activo: boolean } | null>;
  };
};

/**
 * El JWT no se revoca al hacer baja: hay que mirar la DB en cada request.
 * Membresía eliminada, club inactivo/baja o admin de plataforma inactivo → 401.
 * También se rechaza un token firmado ANTES del último cambio de
 * contraseña: cambiar la clave invalida las sesiones emitidas antes.
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
    select: {
      id: true,
      rol: true,
      es_socio: true,
      estado: true,
      club_id: true,
      usuario: { select: { password_changed_at: true } },
    },
  });

  if (!row) {
    throw new UnauthorizedException('Sesión inválida');
  }

  if (
    typeof payload.iat === 'number' &&
    row.usuario.password_changed_at.getTime() > payload.iat * 1000
  ) {
    throw new UnauthorizedException('La contraseña cambió, volvé a ingresar');
  }

  return {
    ...payload,
    role: row.rol,
    es_socio: row.rol === 'socio' || row.es_socio,
    club_id: row.club_id,
  };
}
