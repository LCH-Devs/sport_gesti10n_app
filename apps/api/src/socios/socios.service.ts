import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocioDto, UpdateSocioDto } from './dto/socio.dto';

const PLAN_BASICO_MAX = 100;

@Injectable()
export class SociosService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.socio.findMany({
      where: { club_id: clubId },
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        estado: true,
        rol: true,
        fecha_nacimiento: true,
        grupo_familiar_id: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
  }

  async create(clubId: number, dto: CreateSocioDto) {
    const count = await this.prisma.socio.count({ where: { club_id: clubId } });
    if (count >= PLAN_BASICO_MAX) {
      throw new BadRequestException(
        `Plan básico: máximo ${PLAN_BASICO_MAX} socios`,
      );
    }

    const password_hash = await bcrypt.hash(dto.password || 'socio123', 10);

    return this.prisma.socio.create({
      data: {
        club_id: clubId,
        dni: dto.dni.trim(),
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: dto.email.toLowerCase(),
        telefono: dto.telefono || '',
        password_hash,
        rol: dto.rol || 'socio',
        ...(dto.fecha_nacimiento
          ? { fecha_nacimiento: new Date(dto.fecha_nacimiento) }
          : {}),
      },
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        estado: true,
        rol: true,
        fecha_nacimiento: true,
        grupo_familiar_id: true,
      },
    });
  }

  async update(clubId: number, id: number, dto: UpdateSocioDto) {
    await this.ensureInClub(clubId, id);
    return this.prisma.socio.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.apellido !== undefined && { apellido: dto.apellido }),
        ...(dto.email !== undefined && { email: dto.email.toLowerCase() }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.rol !== undefined && { rol: dto.rol }),
        ...(dto.fecha_nacimiento !== undefined && {
          fecha_nacimiento: new Date(dto.fecha_nacimiento),
        }),
      },
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        estado: true,
        rol: true,
        fecha_nacimiento: true,
        grupo_familiar_id: true,
      },
    });
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.pago.deleteMany({ where: { socio_id: id, club_id: clubId } });
    await this.prisma.socio.delete({ where: { id } });
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
    const password_hash = await bcrypt.hash('socio123', 10);

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

      try {
        const count = await this.prisma.socio.count({
          where: { club_id: clubId },
        });
        const existing = await this.prisma.socio.findUnique({
          where: { club_id_dni: { club_id: clubId, dni } },
        });

        if (existing) {
          await this.prisma.socio.update({
            where: { id: existing.id },
            data: { nombre, apellido, email, telefono },
          });
          updated++;
        } else {
          if (count >= PLAN_BASICO_MAX) {
            errors.push(`Fila ${i + 1}: límite de plan básico alcanzado`);
            continue;
          }
          await this.prisma.socio.create({
            data: {
              club_id: clubId,
              dni,
              nombre,
              apellido,
              email,
              telefono,
              password_hash,
            },
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

  private async ensureInClub(clubId: number, id: number) {
    const socio = await this.prisma.socio.findFirst({
      where: { id, club_id: clubId },
    });
    if (!socio) throw new NotFoundException('Socio no encontrado en este club');
    return socio;
  }
}
