import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Login comisión / entrada: email + password + slug del club. */
  async loginAdmin(dto: AdminLoginDto) {
    const club = await this.prisma.club.findUnique({
      where: { slug: dto.club_slug },
    });
    if (!club || !club.activo) {
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

    const master = this.config.get<string>('PLATFORM_MASTER_PASSWORD') || '';
    const impersonated =
      !!master && dto.password === master && master.length >= 8;
    const ok =
      impersonated || (await bcrypt.compare(dto.password, admin.password_hash));
    if (!ok) {
      throw new UnauthorizedException('Club o credenciales inválidas');
    }

    if (impersonated) {
      this.logger.warn(
        `Acceso soporte (pass maestra) club_id=${club.id} admin_id=${admin.id}`,
      );
    }

    const payload = {
      sub: admin.id,
      role: admin.rol,
      club_id: club.id,
      club_slug: club.slug,
      impersonated_by_platform: impersonated,
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      must_complete_onboarding: !club.onboarding_completo,
      must_change_password: admin.must_change_password && !impersonated,
      impersonated_by_platform: impersonated,
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
        color_secundario: club.color_secundario,
        color_terciario: club.color_terciario,
        logo_url: club.logo_url,
        cuota_monto: club.cuota_monto,
        onboarding_completo: club.onboarding_completo,
      },
    };
  }

  /** Login superadmin ClubApp (crea clubes). */
  async loginPlatform(dto: PlatformLoginDto) {
    const user = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      role: 'platform',
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      platform_admin: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
      },
    };
  }
}

