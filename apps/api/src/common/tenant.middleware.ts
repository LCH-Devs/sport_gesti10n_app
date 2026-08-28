import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { slugFromOrigin, tenantBaseFromWebUrl } from './tenant-host';

export type TenantRequest = Request & {
  clubId?: number;
  clubSlug?: string;
};

/**
 * Resuelve el club por X-Club-Slug, ?club=, o Origin/Referer (subdominio).
 * En rutas autenticadas del club, TenantGuard pisa esto con el club_id del JWT.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const baseDomain =
      this.config.get<string>('TENANT_BASE_DOMAIN') ||
      tenantBaseFromWebUrl(
        this.config.get<string>('WEB_APP_URL') || 'http://localhost:3000',
      );

    const headerSlug = (
      req.headers['x-club-slug'] as string | undefined
    )?.trim();
    const querySlug = (req.query.club as string | undefined)?.trim();
    const originSlug =
      slugFromOrigin(req.headers.origin, baseDomain) ||
      slugFromOrigin(req.headers.referer, baseDomain);

    const explicitSlug = headerSlug || querySlug;
    const slug = explicitSlug || originSlug || undefined;

    if (!slug) {
      return next();
    }

    const club = await this.prisma.club.findUnique({ where: { slug } });
    if (!club || club.eliminado) {
      if (explicitSlug) {
        throw new NotFoundException(`Club no encontrado: ${slug}`);
      }
      return next();
    }

    req.clubId = club.id;
    req.clubSlug = club.slug;
    next();
  }
}
