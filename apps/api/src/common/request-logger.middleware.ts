import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import type { RequestWithId } from './request-id.middleware';

/**
 * Loguea cada request HTTP (método, ruta, status, ms, request-id). Nest no
 * lo hace por default. Debe registrarse DESPUÉS de RequestIdMiddleware en
 * app.module.ts para que req.requestId ya exista.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithId, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const url = req.originalUrl || req.url;
      if (url.startsWith('/health')) return;
      const slug = (req.headers['x-club-slug'] as string | undefined)?.trim();
      const origin = req.headers.origin || '';
      this.logger.log(
        `[${req.requestId}] ${req.method} ${url} ${res.statusCode} ${Date.now() - start}ms` +
          (slug ? ` club=${slug}` : '') +
          (origin ? ` from=${origin}` : ''),
      );
    });
    next();
  }
}
