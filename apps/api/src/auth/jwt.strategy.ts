import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { assertSesionViva, type SessionDb } from './session-viva';
import { resolveJwtSecret } from './auth-security';

export type JwtPayload = {
  sub: number;
  role: string;
  es_socio?: boolean;
  club_id?: number;
  club_slug?: string;
  user_id?: number;
  impersonated_by_platform?: boolean;
  socio_rol?: string;
  /** Puesto por passport-jwt al decodificar; segundos epoch de emisión. */
  iat?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = resolveJwtSecret(
      config.get<string>('JWT_SECRET'),
      config.get<string>('NODE_ENV'),
    );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    return assertSesionViva(this.prisma as unknown as SessionDb, payload);
  }
}
