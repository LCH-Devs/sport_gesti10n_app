import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { assertSesionViva, type SessionDb } from './session-viva';

export type JwtPayload = {
  sub: number;
  role: string;
  club_id?: number;
  club_slug?: string;
  user_id?: number;
  impersonated_by_platform?: boolean;
  socio_rol?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    return assertSesionViva(this.prisma as unknown as SessionDb, payload);
  }
}
