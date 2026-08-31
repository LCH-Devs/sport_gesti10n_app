import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto, UpdateAdminDto, UpdateSelfDto } from './dto/admin.dto';
import { flattenAdmin, isStaffRole, NOT_DELETED, STAFF_ROLES, adminEmailInUseWhere } from '../common/club-users';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: number) {
    const rows = await this.prisma.membresia.findMany({
      where: { club_id: clubId, rol: { in: [...STAFF_ROLES] }, ...NOT_DELETED },
      include: { usuario: { select: { email: true, nombre: true } } },
      orderBy: { usuario: { nombre: 'asc' } },
    });
    return rows.map(flattenAdmin);
  }

  async create(clubId: number, dto: CreateAdminDto) {
    const email = dto.email.toLowerCase();
    const rol = dto.rol === 'entrada' ? 'entrada' : 'admin';
    await this.assertAdminEmailFree(email);

    const existing = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (existing) {
      const inClub = await this.prisma.membresia.findUnique({
        where: {
          usuario_id_club_id: { usuario_id: existing.id, club_id: clubId },
        },
      });
      if (inClub && !inClub.eliminado) {
        throw new BadRequestException('Ese usuario ya está en este club');
      }
      if (inClub?.eliminado) {
        if (existing && dto.nombre.trim()) {
          await this.prisma.usuario.update({
            where: { id: existing.id },
            data: { nombre: dto.nombre.trim() },
          });
        }
        const restored = await this.prisma.membresia.update({
          where: { id: inClub.id },
          data: { eliminado: false, rol, must_change_password: false },
          include: { usuario: { select: { email: true, nombre: true } } },
        });
        return flattenAdmin(restored);
      }
    }

    const password_hash = existing
      ? existing.password_hash
      : await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const usuario = existing
        ? existing
        : await tx.usuario.create({
            data: {
              email,
              password_hash,
              nombre: dto.nombre.trim(),
            },
          });
      if (existing && dto.nombre.trim()) {
        await tx.usuario.update({
          where: { id: existing.id },
          data: { nombre: dto.nombre.trim() },
        });
      }
      return tx.membresia.create({
        data: {
          usuario_id: usuario.id,
          club_id: clubId,
          rol,
          must_change_password: false,
        },
        include: { usuario: { select: { email: true, nombre: true } } },
      });
    });

    return flattenAdmin(created);
  }

  async update(clubId: number, id: number, dto: UpdateAdminDto) {
    const membresia = await this.ensureInClub(clubId, id);
    if (dto.rol !== undefined && !isStaffRole(dto.rol)) {
      throw new BadRequestException('Rol inválido');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.nombre !== undefined || dto.password) {
        await tx.usuario.update({
          where: { id: membresia.usuario_id },
          data: {
            ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
            ...(dto.password
              ? { password_hash: await bcrypt.hash(dto.password, 10) }
              : {}),
          },
        });
      }
      return tx.membresia.update({
        where: { id },
        data: {
          ...(dto.rol !== undefined && { rol: dto.rol }),
        },
        include: { usuario: { select: { email: true, nombre: true } } },
      });
    });
    return flattenAdmin(updated);
  }

  async getSelf(clubId: number, membresiaId: number) {
    const membresia = await this.ensureInClub(clubId, membresiaId);
    const full = await this.prisma.membresia.findUnique({
      where: { id: membresia.id },
      include: { usuario: { select: { email: true, nombre: true } } },
    });
    return flattenAdmin(full!);
  }

  async updateSelf(clubId: number, membresiaId: number, dto: UpdateSelfDto) {
    const membresia = await this.ensureInClub(clubId, membresiaId);
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: membresia.usuario_id },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    let password_hash: string | undefined;
    if (dto.newPassword) {
      const forced = membresia.must_change_password;
      if (!forced) {
        if (!dto.currentPassword) {
          throw new BadRequestException('Ingresá tu contraseña actual');
        }
        const ok = await bcrypt.compare(dto.currentPassword, usuario.password_hash);
        if (!ok) {
          throw new BadRequestException('Contraseña actual incorrecta');
        }
      }
      password_hash = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
          ...(password_hash && { password_hash }),
        },
      });
      if (password_hash) {
        await tx.membresia.update({
          where: { id: membresia.id },
          data: { must_change_password: false },
        });
      }
      return user;
    });

    return flattenAdmin({ id: membresia.id, rol: membresia.rol, usuario: updated });
  }

  async remove(clubId: number, id: number, requesterId: number) {
    await this.ensureInClub(clubId, id);
    if (id === requesterId) {
      throw new BadRequestException('No podés eliminarte a vos mismo');
    }
    const count = await this.prisma.membresia.count({
      where: { club_id: clubId, rol: 'admin', ...NOT_DELETED },
    });
    const target = await this.prisma.membresia.findUnique({ where: { id } });
    if (target?.rol === 'admin' && count <= 1) {
      throw new BadRequestException('Debe quedar al menos un admin en el club');
    }
    await this.prisma.membresia.update({
      where: { id },
      data: { eliminado: true },
    });
    return { ok: true };
  }

  private async assertAdminEmailFree(email: string) {
    const taken = await this.prisma.membresia.findFirst({
      where: adminEmailInUseWhere(email),
    });
    if (taken) {
      throw new BadRequestException(
        'Ese email ya administra un club. La comisión no se comparte entre clubes.',
      );
    }
  }

  private async ensureInClub(clubId: number, id: number) {
    const admin = await this.prisma.membresia.findFirst({
      where: { id, club_id: clubId, rol: { in: [...STAFF_ROLES] }, ...NOT_DELETED },
    });
    if (!admin) throw new NotFoundException('Usuario no encontrado');
    return admin;
  }
}
