import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

const selectPublic = {
  id: true,
  email: true,
  nombre: true,
  rol: true,
} as const;

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.admin.findMany({
      where: { club_id: clubId },
      select: selectPublic,
      orderBy: { nombre: 'asc' },
    });
  }

  async create(clubId: number, dto: CreateAdminDto) {
    const exists = await this.prisma.admin.findUnique({
      where: {
        club_id_email: {
          club_id: clubId,
          email: dto.email.toLowerCase(),
        },
      },
    });
    if (exists) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.admin.create({
      data: {
        club_id: clubId,
        email: dto.email.toLowerCase(),
        nombre: dto.nombre.trim(),
        password_hash,
        rol: dto.rol || 'admin',
      },
      select: selectPublic,
    });
  }

  async update(clubId: number, id: number, dto: UpdateAdminDto) {
    await this.ensureInClub(clubId, id);
    const data: {
      nombre?: string;
      rol?: string;
      password_hash?: string;
    } = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.rol !== undefined) data.rol = dto.rol;
    if (dto.password) data.password_hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.admin.update({
      where: { id },
      data,
      select: selectPublic,
    });
  }

  async remove(clubId: number, id: number, requesterId: number) {
    await this.ensureInClub(clubId, id);
    if (id === requesterId) {
      throw new BadRequestException('No podés eliminarte a vos mismo');
    }
    const count = await this.prisma.admin.count({
      where: { club_id: clubId, rol: 'admin' },
    });
    const target = await this.prisma.admin.findUnique({ where: { id } });
    if (target?.rol === 'admin' && count <= 1) {
      throw new BadRequestException('Debe quedar al menos un admin en el club');
    }
    await this.prisma.admin.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureInClub(clubId: number, id: number) {
    const admin = await this.prisma.admin.findFirst({
      where: { id, club_id: clubId },
    });
    if (!admin) throw new NotFoundException('Usuario no encontrado');
    return admin;
  }
}

