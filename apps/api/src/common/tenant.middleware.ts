import {
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export type TenantRequest = Request & {
  clubId?: number;
  clubSlug?: string;
};

/**
 * Resuelve el club (tenant) por header X-Club-Slug o query ?club=.
 * Deja clubId en el request para que los servicios filtren por club_id.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const slug =
      (req.headers['x-club-slug'] as string | undefined)?.trim() ||
      (req.query.club as string | undefined)?.trim();

    if (!slug) {
      return next();
    }

    const club = await this.prisma.club.findUnique({ where: { slug } });
    if (!club) {
      throw new NotFoundException(`Club no encontrado: ${slug}`);
    }

    req.clubId = club.id;
    req.clubSlug = club.slug;
    next();
  }
}

