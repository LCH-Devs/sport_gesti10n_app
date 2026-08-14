import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Login comisión / entrada: email + password + slug del club. */
  async loginAdmin(dto: AdminLoginDto) {
    const club = await this.prisma.club.findUnique({
      where: { slug: dto.club_slug },
    });
    if (!club) {
      throw new UnauthorizedException('Club o credenciales inválidas');
    }

    const admin = await this.prisma.admin.findUnique({
      where: {
        club_id_email: { club_id: club.id, email: dto.email.toLowerCase() },
      },
    });
    if (!admin) {
      throw new UnauthorizedException('Club o credenciales inválidas');
    }

    const ok = await bcrypt.compare(dto.password, admin.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Club o credenciales inválidas');
    }

    const payload = {
      sub: admin.id,
      role: admin.rol,
      club_id: club.id,
      club_slug: club.slug,
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        rol: admin.rol,
      },
      club: {
        id: club.id,
        slug: club.slug,
        nombre: club.nombre,
        color_primario: club.color_primario,
        logo_url: club.logo_url,
        cuota_monto: club.cuota_monto,
      },
    };
  }
}
