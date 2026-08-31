export const STAFF_ROLES = ['admin', 'entrada'] as const;
export const MEMBER_ROLES = ['socio', 'profe'] as const;

export function isStaffRole(rol: string) {
  return rol === 'admin' || rol === 'entrada';
}

export function isMemberRole(rol: string) {
  return rol === 'socio' || rol === 'profe';
}

export const NOT_DELETED = { eliminado: false } as const;
export const CLUB_NOT_DELETED = { eliminado: false } as const;

/** Un email no puede ser admin de dos clubes vivos. Club dado de baja no cuenta. */
export function adminEmailInUseWhere(email: string) {
  return {
    rol: 'admin',
    ...NOT_DELETED,
    club: CLUB_NOT_DELETED,
    usuario: { email },
  };
}

export const CLUB_NOMBRE_TAKEN =
  'Ya hay un club con ese nombre. Solo se puede reutilizar si el anterior fue dado de baja.';

/** Nombre de club único entre vivos (activo o suspendido). Dado de baja no cuenta. */
export function clubNombreInUseWhere(nombre: string, excludeId?: number) {
  return {
    ...CLUB_NOT_DELETED,
    nombre: { equals: nombre.trim(), mode: 'insensitive' as const },
    ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
  };
}

export const usuarioPublicSelect = {
  email: true,
  nombre: true,
  apellido: true,
  dni: true,
  telefono: true,
  fecha_nacimiento: true,
} as const;

export const personInclude = {
  usuario: { select: usuarioPublicSelect },
} as const;

type UsuarioPublic = {
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  fecha_nacimiento?: Date | null;
};

export function flattenPerson(m: {
  id: number;
  rol: string;
  estado?: string;
  grupo_familiar_id?: number | null;
  usuario: UsuarioPublic;
}) {
  return {
    id: m.id,
    email: m.usuario.email,
    nombre: m.usuario.nombre,
    apellido: m.usuario.apellido,
    dni: m.usuario.dni,
    telefono: m.usuario.telefono,
    estado: m.estado ?? 'activo',
    rol: m.rol,
    fecha_nacimiento: m.usuario.fecha_nacimiento ?? null,
    grupo_familiar_id: m.grupo_familiar_id ?? null,
  };
}

export function flattenAdmin(m: {
  id: number;
  rol: string;
  usuario: { email: string; nombre: string };
}) {
  return {
    id: m.id,
    email: m.usuario.email,
    nombre: m.usuario.nombre,
    rol: m.rol,
  };
}

export function flattenNestedPerson<T extends Record<string, unknown>>(
  row: T,
  key: string,
) {
  const nested = row[key] as
    | { id: number; rol: string; estado?: string; usuario: UsuarioPublic }
    | null
    | undefined;
  if (!nested?.usuario) return row;
  return { ...row, [key]: flattenPerson(nested) };
}
