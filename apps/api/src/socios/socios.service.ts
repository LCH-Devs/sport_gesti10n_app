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
  hasActiveMembershipElsewhere,
  MEMBER_ROLES,
  NOT_DELETED,
  personInclude,
} from '../common/club-users';
import { buildSocioExportCsv, parseSocioImportSource } from './socios-import';
import { defaultSocioPassword, normalizeDni } from '../common/dto-constraints';
import {
  ensureDefaultCategoriaCuota,
  matchCategoriaCuota,
} from '../common/categorias-cuota';
import { PlanSaaSService } from '../plan-saas/plan-saas.service';
import { PagosService } from '../pagos/pagos.service';

const socioWhere = (clubId: number) => ({
  club_id: clubId,
  rol: { in: [...MEMBER_ROLES] },
});

type SocioWriteDb = {
  membresia: PrismaService['membresia'];
  usuario: PrismaService['usuario'];
  club: PrismaService['club'];
  categoriaCuota: PrismaService['categoriaCuota'];
};

@Injectable()
export class SociosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planes: PlanSaaSService,
    private readonly pagos: PagosService,
  ) {}

  async list(clubId: number) {
    const rows = await this.prisma.membresia.findMany({
      where: { ...socioWhere(clubId), ...NOT_DELETED },
      include: personInclude,
      orderBy: [{ usuario: { apellido: 'asc' } }, { usuario: { nombre: 'asc' } }],
    });
    return rows.map(flattenPerson);
  }

  async exportCsv(clubId: number): Promise<string> {
    const rows = await this.list(clubId);
    return buildSocioExportCsv(
      rows.map((r) => ({
        dni: r.dni,
        nombre: r.nombre,
        apellido: r.apellido,
        email: r.email,
        fecha_nacimiento: r.fecha_nacimiento
          ? new Date(r.fecha_nacimiento).toISOString()
          : null,
        rol: r.rol,
        telefono: r.telefono,
        categoria: r.categoria?.nombre ?? '',
        estado: r.estado,
      })),
    );
  }

  async getOne(clubId: number, id: number) {
    const membresia = await this.prisma.membresia.findFirst({
      where: { id, ...socioWhere(clubId), ...NOT_DELETED },
      include: personInclude,
    });
    if (!membresia) {
      throw new NotFoundException('Socio no encontrado en este club');
    }
    return flattenPerson(membresia);
  }

  async create(clubId: number, dto: CreateSocioDto) {
    await this.planes.assertCanAddMembers(
      this.prisma,
      clubId,
      1,
      dto.acepta_upgrade,
    );
    const person = await this.prisma.$transaction((tx) =>
      this.createWithClient(tx, clubId, dto, { skipPlanCheck: true }),
    );
    await this.pagos.generarLinksDeAlta(clubId, [person.id]);
    return person;
  }

  async createWithClient(
    db: SocioWriteDb,
    clubId: number,
    dto: CreateSocioDto,
    opts: { skipPlanCheck?: boolean } = {},
  ) {
    if (!opts.skipPlanCheck) {
      await this.planes.assertCanAddMembers(
        this.prisma,
        clubId,
        1,
        dto.acepta_upgrade,
      );
    }

    const email = dto.email.toLowerCase().trim();
    const dni = normalizeDni(dto.dni);
    const rol = dto.rol === 'profe' ? 'profe' : 'socio';
    const categoria_id = await this.resolveCategoriaId(
      db,
      clubId,
      dto.categoria_id,
    );
    await this.assertDniFree(db, clubId, dni);

    const existingUser = await db.usuario.findUnique({
      where: { email },
    });
    if (existingUser) {
      const already = await db.membresia.findUnique({
        where: {
          usuario_id_club_id: { usuario_id: existingUser.id, club_id: clubId },
        },
      });
      if (already && !already.eliminado) {
        throw new BadRequestException('Ese usuario ya está en este club');
      }
      if (already?.eliminado) {
        // Si esta identidad ya es socio/admin activo en otro club, no le
        // pisamos nombre/dni/teléfono/etc. desde acá: solo reactivamos la
        // membresía de este club con los datos ya existentes.
        const crossClub = await hasActiveMembershipElsewhere(
          db,
          existingUser.id,
          clubId,
        );
        if (!crossClub) {
          await db.usuario.update({
            where: { id: existingUser.id },
            data: {
              nombre: dto.nombre.trim(),
              apellido: dto.apellido.trim(),
              dni,
              telefono: dto.telefono || existingUser.telefono,
              fecha_nacimiento: new Date(dto.fecha_nacimiento),
            },
          });
        }
        const restored = await db.membresia.update({
          where: { id: already.id },
          data: { eliminado: false, rol, estado: 'activo', categoria_id },
          include: personInclude,
        });
        await this.pagos.persistirAlta(db, clubId, restored.id, dto);
        return flattenPerson(restored);
      }
    }

    const password_hash = existingUser
      ? existingUser.password_hash
      : await bcrypt.hash(
          dto.password?.trim() || defaultSocioPassword(dni),
          10,
        );

    const existingUserCrossClub = existingUser
      ? await hasActiveMembershipElsewhere(db, existingUser.id, clubId)
      : false;

    const usuario = existingUser
      ? existingUserCrossClub
        ? existingUser
        : await db.usuario.update({
            where: { id: existingUser.id },
            data: {
              nombre: dto.nombre.trim(),
              apellido: dto.apellido.trim(),
              dni,
              telefono: dto.telefono || existingUser.telefono,
              fecha_nacimiento: new Date(dto.fecha_nacimiento),
            },
          })
      : await db.usuario.create({
          data: {
            email,
            password_hash,
            nombre: dto.nombre.trim(),
            apellido: dto.apellido.trim(),
            dni,
            telefono: dto.telefono || '',
            fecha_nacimiento: new Date(dto.fecha_nacimiento),
          },
        });

    // "socio"+DNI es adivinable a partir de un dato semi-público: si no se
    // fijó una contraseña propia para esta persona nueva, se la obliga a
    // cambiarla en el primer login (mismo criterio que ya rige para admins).
    const usaPasswordPorDefecto = !existingUser && !dto.password?.trim();

    const created = await db.membresia.create({
      data: {
        usuario_id: usuario.id,
        club_id: clubId,
        rol,
        estado: 'activo',
        categoria_id,
        must_change_password: usaPasswordPorDefecto,
      },
      include: personInclude,
    });

    await this.pagos.persistirAlta(db, clubId, created.id, dto);
    return flattenPerson(created);
  }

  async update(clubId: number, id: number, dto: UpdateSocioDto) {
    const membresia = await this.ensureInClub(clubId, id);
    const categoria_id =
      dto.categoria_id !== undefined
        ? await this.resolveCategoriaId(this.prisma, clubId, dto.categoria_id)
        : undefined;

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: membresia.usuario_id },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const identityData: Record<string, unknown> = {};
    if (dto.nombre !== undefined && dto.nombre !== usuario.nombre) {
      identityData.nombre = dto.nombre;
    }
    if (dto.apellido !== undefined && dto.apellido !== usuario.apellido) {
      identityData.apellido = dto.apellido;
    }
    if (
      dto.email !== undefined &&
      dto.email.toLowerCase() !== usuario.email
    ) {
      identityData.email = dto.email.toLowerCase();
    }
    if (dto.telefono !== undefined && dto.telefono !== usuario.telefono) {
      identityData.telefono = dto.telefono;
    }
    if (dto.fecha_nacimiento !== undefined) {
      const incoming = new Date(dto.fecha_nacimiento).getTime();
      if (incoming !== usuario.fecha_nacimiento?.getTime()) {
        identityData.fecha_nacimiento = new Date(dto.fecha_nacimiento);
      }
    }

    if (Object.keys(identityData).length > 0) {
      const crossClub = await hasActiveMembershipElsewhere(
        this.prisma,
        usuario.id,
        clubId,
      );
      if (crossClub) {
        throw new BadRequestException(
          'Esta persona también es socio/admin activo en otro club: nombre, apellido, email, teléfono y fecha de nacimiento son datos compartidos y no se pueden editar desde acá.',
        );
      }
      if (identityData.email) {
        const taken = await this.prisma.usuario.findFirst({
          where: {
            email: identityData.email as string,
            NOT: { id: membresia.usuario_id },
          },
        });
        if (taken) {
          throw new BadRequestException('Ese email ya está en uso');
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(identityData).length > 0) {
        await tx.usuario.update({
          where: { id: membresia.usuario_id },
          data: identityData,
        });
      }

      return tx.membresia.update({
        where: { id },
        data: {
          ...(dto.estado !== undefined && { estado: dto.estado }),
          ...(dto.rol !== undefined && {
            rol: dto.rol === 'profe' ? 'profe' : 'socio',
          }),
          ...(categoria_id !== undefined && { categoria_id }),
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
   * Importa CSV o Excel (xlsx/xls). Cabecera:
   * dni,nombre,apellido,email,fecha_nacimiento,rol[,telefono]
   */
  async importCsv(
    clubId: number,
    source:
      | string
      | {
          csvText?: string;
          buffer?: Buffer;
          filename?: string;
          acepta_upgrade?: boolean;
        },
  ) {
    const payload = typeof source === 'string' ? { csvText: source } : source;
    const parsed = parseSocioImportSource(payload);
    const errors = [...parsed.errors];
    let created = 0;
    let updated = 0;
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { cuota_monto: true },
    });
    await ensureDefaultCategoriaCuota(this.prisma, clubId, {
      monto: club?.cuota_monto ?? 5000,
    });
    const categorias = await this.prisma.categoriaCuota.findMany({
      where: { club_id: clubId, ...NOT_DELETED },
    });

    const classified: Array<{
      row: (typeof parsed.rows)[number];
      existing: { id: number; usuario_id: number; usuario: { email: string } } | null;
    }> = [];
    let newCount = 0;
    for (const row of parsed.rows) {
      const existing = await this.prisma.membresia.findFirst({
        where: {
          ...socioWhere(clubId),
          ...NOT_DELETED,
          usuario: { dni: row.dni },
        },
        include: { usuario: { select: { email: true } } },
      });
      classified.push({ row, existing });
      if (!existing) newCount += 1;
    }
    await this.planes.assertCanAddMembers(
      this.prisma,
      clubId,
      newCount,
      payload.acepta_upgrade,
    );

    for (const { row, existing } of classified) {
      const categoria = matchCategoriaCuota(categorias, row.categoria);
      if (!categoria) {
        errors.push(
          `Fila ${row.line}: categoría desconocida (usá el nombre del club o dejala vacía para Socio pleno)`,
        );
        continue;
      }
      try {
        if (existing) {
          if (existing.usuario.email.toLowerCase() !== row.email) {
            errors.push(
              `Fila ${row.line}: ya hay un usuario con ese DNI en el club`,
            );
            continue;
          }
          const crossClub = await hasActiveMembershipElsewhere(
            this.prisma,
            existing.usuario_id,
            clubId,
          );
          await this.prisma.$transaction(async (tx) => {
            if (!crossClub) {
              await tx.usuario.update({
                where: { id: existing.usuario_id },
                data: {
                  nombre: row.nombre,
                  apellido: row.apellido,
                  telefono: row.telefono,
                  fecha_nacimiento: new Date(row.fecha_nacimiento),
                },
              });
            }
            await tx.membresia.update({
              where: { id: existing.id },
              data: { rol: row.rol, categoria_id: categoria.id },
            });
          });
          if (crossClub) {
            errors.push(
              `Fila ${row.line}: es socio/admin activo en otro club — se actualizó rol/categoría pero no sus datos personales compartidos`,
            );
          }
          updated++;
          continue;
        }

        await this.createWithClient(this.prisma, clubId, {
          dni: row.dni,
          nombre: row.nombre,
          apellido: row.apellido,
          email: row.email,
          ...(row.telefono ? { telefono: row.telefono } : {}),
          fecha_nacimiento: row.fecha_nacimiento,
          rol: row.rol,
          categoria_id: categoria.id,
          acepta_upgrade: true,
        }, { skipPlanCheck: true });
        created++;
      } catch (e) {
        errors.push(
          `Fila ${row.line}: ${e instanceof Error ? e.message : 'error'}`,
        );
      }
    }

    return { created, updated, errors };
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
        ...(password_hash && { password_hash, password_changed_at: new Date() }),
      },
    });

    if (password_hash && membresia.must_change_password) {
      await this.prisma.membresia.update({
        where: { id: membresia.id },
        data: { must_change_password: false },
      });
    }

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
          tipo: true,
          concepto: true,
        } as Record<string, boolean>,
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

  private async resolveCategoriaId(
    db: SocioWriteDb,
    clubId: number,
    categoriaId?: number,
  ) {
    if (categoriaId) {
      const cat = await db.categoriaCuota.findFirst({
        where: { id: categoriaId, club_id: clubId, ...NOT_DELETED },
      });
      if (!cat) {
        throw new BadRequestException('Categoría no encontrada en este club');
      }
      return cat.id;
    }
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { cuota_monto: true },
    });
    const def = await ensureDefaultCategoriaCuota(db, clubId, {
      monto: club?.cuota_monto ?? 5000,
    });
    return def.id;
  }

  private async assertDniFree(
    db: SocioWriteDb,
    clubId: number,
    dni: string,
    exceptId?: number,
  ) {
    const taken = await db.membresia.findFirst({
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
