import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { isStaffRole, NOT_DELETED } from '../common/club-users';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { SocioLoginDto } from './dto/socio-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JWT_EXPIRES_SECONDS } from './auth-security';
import { LoginAttemptService } from './login-attempt.service';

const clubSelect = {
  id: true,
  slug: true,
  nombre: true,
  color_primario: true,
  color_secundario: true,
  color_terciario: true,
  logo_url: true,
  cuota_monto: true,
  onboarding_completo: true,
  activo: true,
  eliminado: true,
} as const;

type ClubRow = {
  id: number;
  slug: string;
  nombre: string;
  color_primario: string;
  color_secundario: string | null;
  color_terciario: string | null;
  logo_url: string | null;
  cuota_monto: number;
  onboarding_completo: boolean;
  activo: boolean;
  eliminado: boolean;
};

type MembresiaRow = {
  id: number;
  rol: string;
  estado: string;
  must_change_password: boolean;
  club: ClubRow;
  usuario: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    password_hash: string;
  };
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly loginAttempts: LoginAttemptService,
  ) {}

  /** Login único: comisión, portería, socio o profe. */
  async login(dto: AdminLoginDto | SocioLoginDto): Promise<LoginResponseDto> {
    const email = dto.email.toLowerCase().trim();
    this.loginAttempts.assertNotLocked(email);
    const slug = dto.club_slug?.trim().toLowerCase();
    const master = this.config.get<string>('PLATFORM_MASTER_PASSWORD') || '';
    const masterOk = !!master && dto.password === master && master.length >= 8;

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        membresias: {
          where: NOT_DELETED,
          include: { club: { select: clubSelect } },
        },
      },
    });
    if (!usuario) {
      this.loginAttempts.recordFailure(email);
      throw new UnauthorizedException('Club o credenciales inválidas');
    }

    const passwordOk =
      masterOk || (await bcrypt.compare(dto.password, usuario.password_hash));
    if (!passwordOk) {
      this.loginAttempts.recordFailure(email);
      throw new UnauthorizedException('Club o credenciales inválidas');
    }
    this.loginAttempts.recordSuccess(email);

    const usable = usuario.membresias.filter((row) => {
      if (row.eliminado) return false;
      if (row.club.eliminado) return false;
      if (!row.club.activo) return false;
      if (row.estado === 'suspendido') return false;
      if (masterOk && !isStaffRole(row.rol)) return false;
      return true;
    });
    if (usable.length === 0) {
      throw new UnauthorizedException('Club o credenciales inválidas');
    }

    const chosen = this.pickMembresia(usable, slug);
    if (!chosen) {
      throw new UnauthorizedException('Club o credenciales inválidas');
    }

    return this.issueSession(
      {
        id: chosen.id,
        rol: chosen.rol,
        estado: chosen.estado,
        must_change_password: chosen.must_change_password,
        club: chosen.club,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          dni: usuario.dni,
          password_hash: usuario.password_hash,
        },
      },
      usable.map((row) => ({
        membresia_id: row.id,
        rol: row.rol,
        club: {
          id: row.club.id,
          slug: row.club.slug,
          nombre: row.club.nombre,
          logo_url: row.club.logo_url,
        },
      })),
      masterOk && isStaffRole(chosen.rol),
    );
  }

  loginAdmin(dto: AdminLoginDto): Promise<LoginResponseDto> {
    return this.login(dto);
  }

  loginSocio(dto: SocioLoginDto): Promise<LoginResponseDto> {
    return this.login(dto);
  }

  async switchCuenta(
    payload: { sub: number; user_id?: number },
    membresiaId: number,
  ): Promise<LoginResponseDto> {
    let usuarioId = payload.user_id;
    if (!usuarioId) {
      const current = await this.prisma.membresia.findUnique({
        where: { id: payload.sub },
        select: { usuario_id: true },
      });
      usuarioId = current?.usuario_id;
    }
    if (!usuarioId) {
      throw new UnauthorizedException('No podés entrar a esa cuenta');
    }
    const row = await this.prisma.membresia.findFirst({
      where: { id: membresiaId, usuario_id: usuarioId, ...NOT_DELETED },
      include: {
        club: { select: clubSelect },
        usuario: true,
      },
    });
    if (!row || row.club.eliminado || !row.club.activo || row.estado === 'suspendido') {
      throw new UnauthorizedException('No podés entrar a esa cuenta');
    }

    const usable = await this.prisma.membresia.findMany({
      where: {
        usuario_id: usuarioId,
        ...NOT_DELETED,
        estado: { not: 'suspendido' },
        club: { activo: true, eliminado: false },
      },
      include: { club: { select: clubSelect } },
    });

    return this.issueSession(
      {
        id: row.id,
        rol: row.rol,
        estado: row.estado,
        must_change_password: row.must_change_password,
        club: row.club,
        usuario: {
          id: row.usuario.id,
          email: row.usuario.email,
          nombre: row.usuario.nombre,
          apellido: row.usuario.apellido,
          dni: row.usuario.dni,
          password_hash: row.usuario.password_hash,
        },
      },
      usable.map((m) => ({
        membresia_id: m.id,
        rol: m.rol,
        club: {
          id: m.club.id,
          slug: m.club.slug,
          nombre: m.club.nombre,
          logo_url: m.club.logo_url,
        },
      })),
      false,
    );
  }

  /** Login superadmin ClubApp (crea clubes). */
  async loginPlatform(dto: PlatformLoginDto) {
    const email = dto.email.toLowerCase().trim();
    this.loginAttempts.assertNotLocked(email);
    const user = await this.prisma.platformAdmin.findUnique({
      where: { email },
    });
    if (!user || !user.activo) {
      this.loginAttempts.recordFailure(email);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) {
      this.loginAttempts.recordFailure(email);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    this.loginAttempts.recordSuccess(email);

    const payload = {
      sub: user.id,
      role: 'platform',
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      expires_in: JWT_EXPIRES_SECONDS,
      platform_admin: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
      },
    };
  }

  private pickMembresia<T extends { rol: string; club: { slug: string } }>(
    rows: T[],
    slug?: string,
  ): T | undefined {
    if (slug) {
      return rows.find((row) => row.club.slug === slug);
    }
    const staff = rows.filter((row) => isStaffRole(row.rol));
    if (staff.length === 1 && rows.length === 1) return staff[0];
    return rows[0];
  }

  private async issueSession(
    membresia: MembresiaRow,
    cuentas: Array<{
      membresia_id: number;
      rol: string;
      club: {
        id: number;
        slug: string;
        nombre: string;
        logo_url: string | null;
      };
    }>,
    impersonated: boolean,
  ): Promise<LoginResponseDto> {
    if (impersonated) {
      this.logger.warn(
        `Acceso soporte (pass maestra) club_id=${membresia.club.id} membresia_id=${membresia.id}`,
      );
    }

    const payload = {
      sub: membresia.id,
      user_id: membresia.usuario.id,
      role: membresia.rol,
      club_id: membresia.club.id,
      club_slug: membresia.club.slug,
      impersonated_by_platform: impersonated,
    };

    const club = {
      id: membresia.club.id,
      slug: membresia.club.slug,
      nombre: membresia.club.nombre,
      color_primario: membresia.club.color_primario,
      color_secundario: membresia.club.color_secundario,
      color_terciario: membresia.club.color_terciario,
      logo_url: membresia.club.logo_url,
      cuota_monto: membresia.club.cuota_monto,
      onboarding_completo: membresia.club.onboarding_completo,
    };

    const access_token = await this.jwt.signAsync(payload);
    const staff = isStaffRole(membresia.rol);

    return {
      access_token,
      expires_in: JWT_EXPIRES_SECONDS,
      role: membresia.rol,
      cuentas,
      must_complete_onboarding: staff ? !membresia.club.onboarding_completo : false,
      must_change_password:
        staff && membresia.must_change_password && !impersonated,
      impersonated_by_platform: impersonated,
      admin: staff
        ? {
            id: membresia.id,
            email: membresia.usuario.email,
            nombre: membresia.usuario.nombre,
            rol: membresia.rol,
          }
        : undefined,
      socio: !staff
        ? {
            id: membresia.id,
            email: membresia.usuario.email,
            nombre: membresia.usuario.nombre,
            apellido: membresia.usuario.apellido,
            dni: membresia.usuario.dni,
            estado: membresia.estado,
            rol: membresia.rol,
          }
        : undefined,
      club,
    };
  }
}
