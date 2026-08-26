import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/** Loguea cada request HTTP (método, ruta, status, ms). Nest no lo hace por default. */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const url = req.originalUrl || req.url;
      if (url.startsWith('/health')) return;
      const slug = (req.headers['x-club-slug'] as string | undefined)?.trim();
      const origin = req.headers.origin || '';
      this.logger.log(
        `${req.method} ${url} ${res.statusCode} ${Date.now() - start}ms` +
          (slug ? ` club=${slug}` : '') +
          (origin ? ` from=${origin}` : ''),
      );
    });
    next();
  }
}
