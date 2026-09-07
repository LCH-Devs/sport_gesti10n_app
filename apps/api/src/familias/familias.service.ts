import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamiliaDto, UpdateFamiliaDto } from './dto/familia.dto';
import { flattenPerson, NOT_DELETED, personInclude } from '../common/club-users';
import { SociosService } from '../socios/socios.service';
import { CreateSocioDto } from '../socios/dto/socio.dto';
import { PlanSaaSService } from '../plan-saas/plan-saas.service';
import { PagosService } from '../pagos/pagos.service';
import { AltaCobrosFields } from '../pagos/dto/alta-cobros.dto';

type FamiliaDb = Pick<
  PrismaService,
  'grupoFamiliar' | 'membresia' | 'usuario' | 'club' | 'categoriaCuota'
>;

@Injectable()
export class FamiliasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socios: SociosService,
    private readonly planes: PlanSaaSService,
    private readonly pagos: PagosService,
  ) {}

  async list(clubId: number) {
    const rows = await this.prisma.grupoFamiliar.findMany({
      where: { club_id: clubId, ...NOT_DELETED },
      include: {
        titular: { include: personInclude },
        socios: { where: NOT_DELETED, include: personInclude },
      },
      orderBy: { nombre: 'asc' },
    });
    return rows.map((g) => this.shape(g));
  }

  async getOne(clubId: number, id: number) {
    return this.findOne(this.prisma, clubId, id);
  }

  async create(clubId: number, dto: CreateFamiliaDto) {
    this.assertCreateTitular(dto);
    await this.planes.assertCanAddMembers(
      this.prisma,
      clubId,
      (dto.titular ? 1 : 0) + (dto.socios_nuevos?.length || 0),
      dto.acepta_upgrade,
    );
    const { grupo, nuevosIds } = await this.prisma.$transaction(async (tx) => {
      const { titularId, nuevoTitularId } = await this.resolveTitularId(
        tx,
        clubId,
        this.conAlta(dto, dto),
      );
      const { memberIds, nuevosIds } = await this.collectMemberIds(tx, clubId, {
        titularId,
        socioIds: dto.socio_ids || [],
        sociosNuevos: (dto.socios_nuevos || []).map((p) => this.conAltaPersona(p, dto)),
      });
      const created = await tx.grupoFamiliar.create({
        data: {
          club_id: clubId,
          nombre: dto.nombre.trim(),
          titular_id: titularId,
        },
      });
      await this.replaceMembers(tx, clubId, created.id, memberIds);
      return {
        grupo: await this.findOne(tx, clubId, created.id),
        nuevosIds: [...nuevosIds, ...(nuevoTitularId ? [nuevoTitularId] : [])],
      };
    });
    await this.pagos.generarLinksDeAlta(clubId, nuevosIds);
    return grupo;
  }

  async update(clubId: number, id: number, dto: UpdateFamiliaDto) {
    if (dto.titular_id != null && dto.titular) {
      throw new BadRequestException(
        'Indicá un titular existente o los datos de uno nuevo, no ambos',
      );
    }
    await this.planes.assertCanAddMembers(
      this.prisma,
      clubId,
      (dto.titular ? 1 : 0) + (dto.socios_nuevos?.length || 0),
      dto.acepta_upgrade,
    );
    const { grupo, nuevosIds } = await this.prisma.$transaction(async (tx) => {
      const grupo = await this.ensureInClub(tx, clubId, id);
      const { titularId, nuevoTitularId } = await this.resolveTitularId(tx, clubId, {
        titular_id: dto.titular_id ?? grupo.titular_id,
        titular: dto.titular ? this.conAltaPersona(dto.titular, dto) : undefined,
      });

      await tx.grupoFamiliar.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          titular_id: titularId,
        },
      });

      const touchMembers =
        dto.socio_ids !== undefined ||
        (dto.socios_nuevos && dto.socios_nuevos.length > 0) ||
        dto.titular != null ||
        (dto.titular_id != null && dto.titular_id !== grupo.titular_id);

      let extraNuevos: number[] = [];
      if (touchMembers) {
        const currentIds =
          dto.socio_ids !== undefined
            ? dto.socio_ids
            : (
                await tx.membresia.findMany({
                  where: { club_id: clubId, grupo_familiar_id: id, ...NOT_DELETED },
                  select: { id: true },
                })
              ).map((m) => m.id);
        const collected = await this.collectMemberIds(tx, clubId, {
          titularId,
          socioIds: currentIds,
          sociosNuevos: (dto.socios_nuevos || []).map((p) =>
            this.conAltaPersona(p, dto),
          ),
        });
        extraNuevos = collected.nuevosIds;
        await this.replaceMembers(tx, clubId, id, collected.memberIds);
      }

      return {
        grupo: await this.findOne(tx, clubId, id),
        nuevosIds: [...extraNuevos, ...(nuevoTitularId ? [nuevoTitularId] : [])],
      };
    });
    await this.pagos.generarLinksDeAlta(clubId, nuevosIds);
    return grupo;
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(this.prisma, clubId, id);
    await this.prisma.membresia.updateMany({
      where: { club_id: clubId, grupo_familiar_id: id },
      data: { grupo_familiar_id: null },
    });
    await this.prisma.grupoFamiliar.update({
      where: { id },
      data: { eliminado: true },
    });
    return { ok: true };
  }

  private assertCreateTitular(dto: CreateFamiliaDto) {
    const hasId = dto.titular_id != null;
    const hasNew = dto.titular != null;
    if (hasId === hasNew) {
      throw new BadRequestException(
        'Indicá un titular existente o los datos de uno nuevo, no ambos',
      );
    }
  }

  private conAlta<T extends { titular?: CreateSocioDto }>(
    dto: T,
    alta: AltaCobrosFields,
  ): T {
    if (!dto.titular) return dto;
    return { ...dto, titular: this.conAltaPersona(dto.titular, alta) };
  }

  private conAltaPersona(
    persona: CreateSocioDto,
    alta: AltaCobrosFields,
  ): CreateSocioDto {
    return {
      ...persona,
      inscripcion: persona.inscripcion ?? alta.inscripcion,
      inscripcion_monto: persona.inscripcion_monto ?? alta.inscripcion_monto,
      inscripcion_cuotas: persona.inscripcion_cuotas ?? alta.inscripcion_cuotas,
      bonificar_meses: persona.bonificar_meses ?? alta.bonificar_meses,
    };
  }

  private async resolveTitularId(
    db: FamiliaDb,
    clubId: number,
    dto: { titular_id?: number; titular?: CreateSocioDto },
  ) {
    if (dto.titular) {
      const created = await this.socios.createWithClient(db, clubId, dto.titular);
      return { titularId: created.id, nuevoTitularId: created.id };
    }
    const titularId = dto.titular_id;
    if (titularId == null) {
      throw new BadRequestException('Falta el titular del grupo');
    }
    await this.ensureSocio(db, clubId, titularId);
    return { titularId, nuevoTitularId: null as number | null };
  }

  private async collectMemberIds(
    db: FamiliaDb,
    clubId: number,
    opts: {
      titularId: number;
      socioIds: number[];
      sociosNuevos: CreateSocioDto[];
    },
  ) {
    const memberIds = new Set(opts.socioIds);
    memberIds.add(opts.titularId);
    const nuevosIds: number[] = [];
    for (const nuevo of opts.sociosNuevos) {
      const created = await this.socios.createWithClient(db, clubId, nuevo);
      memberIds.add(created.id);
      nuevosIds.push(created.id);
    }
    await this.ensureSocios(db, clubId, [...memberIds]);
    return { memberIds, nuevosIds };
  }

  private async replaceMembers(
    db: FamiliaDb,
    clubId: number,
    grupoId: number,
    memberIds: Set<number>,
  ) {
    await db.membresia.updateMany({
      where: { club_id: clubId, grupo_familiar_id: grupoId },
      data: { grupo_familiar_id: null },
    });
    await db.membresia.updateMany({
      where: { club_id: clubId, id: { in: [...memberIds] } },
      data: { grupo_familiar_id: grupoId },
    });
  }

  private async findOne(db: FamiliaDb, clubId: number, id: number) {
    const g = await db.grupoFamiliar.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
      include: {
        titular: { include: personInclude },
        socios: { where: NOT_DELETED, include: personInclude },
      },
    });
    if (!g) throw new NotFoundException('Familia no encontrada');
    return this.shape(g);
  }

  private shape(g: {
    titular: Parameters<typeof flattenPerson>[0];
    socios: Array<Parameters<typeof flattenPerson>[0]>;
    [key: string]: unknown;
  }) {
    return {
      ...g,
      titular: flattenPerson(g.titular),
      socios: g.socios.map(flattenPerson),
    };
  }

  private async ensureInClub(db: FamiliaDb, clubId: number, id: number) {
    const g = await db.grupoFamiliar.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
    });
    if (!g) throw new NotFoundException('Familia no encontrada');
    return g;
  }

  private async ensureSocio(db: FamiliaDb, clubId: number, socioId: number) {
    const s = await db.membresia.findFirst({
      where: { id: socioId, club_id: clubId, ...NOT_DELETED },
    });
    if (!s) throw new BadRequestException(`Socio ${socioId} no encontrado`);
    return s;
  }

  private async ensureSocios(db: FamiliaDb, clubId: number, ids: number[]) {
    for (const id of ids) await this.ensureSocio(db, clubId, id);
  }
}
