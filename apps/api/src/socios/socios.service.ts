import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocioDto, UpdateSelfSocioDto, UpdateSocioDto } from './dto/socio.dto';
import {
  flattenPerson,
  MEMBER_ROLES,
  NOT_DELETED,
  personInclude,
} from '../common/club-users';
import { isValidDni, isValidPersonName } from '../common/dto-constraints';

const PLAN_BASICO_MAX = 100;

const socioWhere = (clubId: number) => ({
  club_id: clubId,
  rol: { in: [...MEMBER_ROLES] },
});

@Injectable()
export class SociosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: number) {
    const rows = await this.prisma.membresia.findMany({
      where: { ...socioWhere(clubId), ...NOT_DELETED },
      include: personInclude,
      orderBy: [{ usuario: { apellido: 'asc' } }, { usuario: { nombre: 'asc' } }],
    });
    return rows.map(flattenPerson);
  }

  async create(clubId: number, dto: CreateSocioDto) {
    const count = await this.prisma.membresia.count({
      where: { ...socioWhere(clubId), ...NOT_DELETED },
    });
    if (count >= PLAN_BASICO_MAX) {
      throw new BadRequestException(
        `Plan básico: máximo ${PLAN_BASICO_MAX} socios`,
      );
    }

    const email = dto.email.toLowerCase().trim();
    const dni = dto.dni.trim();
    const rol = dto.rol === 'profe' ? 'profe' : 'socio';
    await this.assertDniFree(clubId, dni);

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (existingUser) {
      const already = await this.prisma.membresia.findUnique({
        where: {
          usuario_id_club_id: { usuario_id: existingUser.id, club_id: clubId },
        },
      });
      if (already && !already.eliminado) {
        throw new BadRequestException('Ese usuario ya está en este club');
      }
      if (already?.eliminado) {
        await this.prisma.usuario.update({
          where: { id: existingUser.id },
          data: {
            nombre: dto.nombre.trim(),
            apellido: dto.apellido.trim(),
            dni,
            telefono: dto.telefono || existingUser.telefono,
            ...(dto.fecha_nacimiento
              ? { fecha_nacimiento: new Date(dto.fecha_nacimiento) }
              : {}),
          },
        });
        const restored = await this.prisma.membresia.update({
          where: { id: already.id },
          data: { eliminado: false, rol, estado: 'activo' },
          include: personInclude,
        });
        return flattenPerson(restored);
      }
    }

    const password_hash = existingUser
      ? existingUser.password_hash
      : await bcrypt.hash(dto.password || 'socio123', 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const usuario = existingUser
        ? await tx.usuario.update({
            where: { id: existingUser.id },
            data: {
              nombre: dto.nombre.trim(),
              apellido: dto.apellido.trim(),
              dni,
              telefono: dto.telefono || existingUser.telefono,
              ...(dto.fecha_nacimiento
                ? { fecha_nacimiento: new Date(dto.fecha_nacimiento) }
                : {}),
            },
          })
        : await tx.usuario.create({
            data: {
              email,
              password_hash,
              nombre: dto.nombre.trim(),
              apellido: dto.apellido.trim(),
              dni,
              telefono: dto.telefono || '',
              ...(dto.fecha_nacimiento
                ? { fecha_nacimiento: new Date(dto.fecha_nacimiento) }
                : {}),
            },
          });

      return tx.membresia.create({
        data: {
          usuario_id: usuario.id,
          club_id: clubId,
          rol,
          estado: 'activo',
        },
        include: personInclude,
      });
    });

    return flattenPerson(created);
  }

  async update(clubId: number, id: number, dto: UpdateSocioDto) {
    const membresia = await this.ensureInClub(clubId, id);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (
        dto.nombre !== undefined ||
        dto.apellido !== undefined ||
        dto.email !== undefined ||
        dto.telefono !== undefined ||
        dto.fecha_nacimiento !== undefined
      ) {
        if (dto.email !== undefined) {
          const email = dto.email.toLowerCase();
          const taken = await tx.usuario.findFirst({
            where: { email, NOT: { id: membresia.usuario_id } },
          });
          if (taken) {
            throw new BadRequestException('Ese email ya está en uso');
          }
        }
        await tx.usuario.update({
          where: { id: membresia.usuario_id },
          data: {
            ...(dto.nombre !== undefined && { nombre: dto.nombre }),
            ...(dto.apellido !== undefined && { apellido: dto.apellido }),
            ...(dto.email !== undefined && { email: dto.email.toLowerCase() }),
            ...(dto.telefono !== undefined && { telefono: dto.telefono }),
            ...(dto.fecha_nacimiento !== undefined && {
              fecha_nacimiento: new Date(dto.fecha_nacimiento),
            }),
          },
        });
      }

      return tx.membresia.update({
        where: { id },
        data: {
          ...(dto.estado !== undefined && { estado: dto.estado }),
          ...(dto.rol !== undefined && {
            rol: dto.rol === 'profe' ? 'profe' : 'socio',
          }),
        },
        include: personInclude,
      });
    });
    return flattenPerson(updated);
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.membresia.update({
      where: { id },
      data: { eliminado: true, grupo_familiar_id: null },
    });
    return { ok: true };
  }

  /**
   * Importa CSV con cabecera:
   * dni,nombre,apellido,email,telefono
   */
  async importCsv(clubId: number, csvText: string) {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException('CSV vacío o sin filas de datos');
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const idx = {
      dni: header.indexOf('dni'),
      nombre: header.indexOf('nombre'),
      apellido: header.indexOf('apellido'),
      email: header.indexOf('email'),
      telefono: header.indexOf('telefono'),
    };
    if (idx.dni < 0 || idx.nombre < 0 || idx.apellido < 0 || idx.email < 0) {
      throw new BadRequestException(
        'Cabecera requerida: dni,nombre,apellido,email[,telefono]',
      );
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const dni = cols[idx.dni]?.trim();
      const nombre = cols[idx.nombre]?.trim();
      const apellido = cols[idx.apellido]?.trim();
      const email = cols[idx.email]?.trim()?.toLowerCase();
      const telefono =
        idx.telefono >= 0 ? cols[idx.telefono]?.trim() || '' : '';

      if (!dni || !nombre || !apellido || !email) {
        errors.push(`Fila ${i + 1}: datos incompletos`);
        continue;
      }
      if (!isValidDni(dni)) {
        errors.push(`Fila ${i + 1}: DNI inválido (7 u 8 dígitos)`);
        continue;
      }
      if (!isValidPersonName(nombre) || !isValidPersonName(apellido)) {
        errors.push(`Fila ${i + 1}: nombre o apellido inválido`);
        continue;
      }
      if (!email.includes('@') || email.length > 254) {
        errors.push(`Fila ${i + 1}: email inválido`);
        continue;
      }

      try {
        const count = await this.prisma.membresia.count({
          where: { ...socioWhere(clubId), ...NOT_DELETED },
        });
        const existing = await this.prisma.membresia.findFirst({
          where: {
            ...socioWhere(clubId),
            ...NOT_DELETED,
            usuario: { dni },
          },
        });

        if (existing) {
          await this.prisma.usuario.update({
            where: { id: existing.usuario_id },
            data: { nombre, apellido, email, telefono },
          });
          updated++;
        } else {
          if (count >= PLAN_BASICO_MAX) {
            errors.push(`Fila ${i + 1}: límite de plan básico alcanzado`);
            continue;
          }
          await this.create(clubId, {
            dni,
            nombre,
            apellido,
            email,
            telefono,
            password: 'socio123',
          });
          created++;
        }
      } catch (e) {
        errors.push(
          `Fila ${i + 1}: ${e instanceof Error ? e.message : 'error'}`,
        );
      }
    }

    return { created, updated, errors };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    result.push(current);
    return result;
  }

  async updateSelf(clubId: number, socioId: number, dto: UpdateSelfSocioDto) {
    const membresia = await this.prisma.membresia.findFirst({
      where: { id: socioId, club_id: clubId, ...NOT_DELETED },
    });
    if (!membresia) {
      throw new NotFoundException('Socio no encontrado en este club');
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: membresia.usuario_id },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    let password_hash: string | undefined;
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Ingresá tu contraseña actual');
      }
      const ok = await bcrypt.compare(dto.currentPassword, usuario.password_hash);
      if (!ok) {
        throw new BadRequestException('Contraseña actual incorrecta');
      }
      password_hash = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.apellido !== undefined && { apellido: dto.apellido.trim() }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono.trim() }),
        ...(password_hash && { password_hash }),
      },
    });

    return flattenPerson({ ...membresia, usuario: updated });
  }

  async portalMe(clubId: number, socioId: number) {
    const membresia = await this.prisma.membresia.findFirst({
      where: { id: socioId, club_id: clubId, ...NOT_DELETED },
      include: personInclude,
    });
    if (!membresia) {
      throw new NotFoundException('Socio no encontrado en este club');
    }
    const socio = flattenPerson(membresia);

    const [club, pagos, noticias, inscripciones] = await Promise.all([
      this.prisma.club.findUnique({
        where: { id: clubId },
        select: {
          id: true,
          slug: true,
          nombre: true,
          logo_url: true,
          color_primario: true,
          color_secundario: true,
          color_terciario: true,
          cuota_monto: true,
        },
      }),
      this.prisma.pago.findMany({
        where: { club_id: clubId, socio_id: socioId },
        orderBy: { mes: 'desc' },
        take: 12,
        select: {
          id: true,
          mes: true,
          monto: true,
          estado: true,
          mp_init_point: true,
          fecha_pago: true,
        },
      }),
      this.prisma.noticia.findMany({
        where: { club_id: clubId, published: true, ...NOT_DELETED },
        orderBy: { fecha: 'desc' },
        take: 8,
        select: {
          id: true,
          titulo: true,
          cuerpo: true,
          fecha: true,
          es_evento: true,
          imagen_url: true,
        },
      }),
      this.prisma.socioActividad.findMany({
        where: { socio_id: socioId, actividad: NOT_DELETED },
        include: {
          actividad: { select: { id: true, nombre: true } },
        },
      }),
    ]);

    return {
      socio,
      club,
      pagos,
      noticias,
      actividades: inscripciones.map((row) => row.actividad),
    };
  }

  private async assertDniFree(clubId: number, dni: string, exceptId?: number) {
    const taken = await this.prisma.membresia.findFirst({
      where: {
        club_id: clubId,
        ...NOT_DELETED,
        usuario: { dni },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
    });
    if (taken) {
      throw new BadRequestException('Ya hay un usuario con ese DNI en el club');
    }
  }

  private async ensureInClub(clubId: number, id: number) {
    const socio = await this.prisma.membresia.findFirst({
      where: { id, club_id: clubId, rol: { in: [...MEMBER_ROLES] }, ...NOT_DELETED },
    });
    if (!socio) throw new NotFoundException('Socio no encontrado en este club');
    return socio;
  }
}
