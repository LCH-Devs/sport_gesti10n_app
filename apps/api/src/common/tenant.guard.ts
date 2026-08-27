import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';
import { TenantRequest } from './tenant.middleware';
import { slugFromOrigin, tenantBaseFromWebUrl } from './tenant-host';

function tenantBaseDomain() {
  return (
    process.env.TENANT_BASE_DOMAIN ||
    tenantBaseFromWebUrl(process.env.WEB_APP_URL || 'http://localhost:3000')
  );
}

/**
 * El JWT es la fuente de verdad del tenant.
 * Ni el header ni el Origin pueden cambiar de club.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<
      TenantRequest & { user?: JwtPayload }
    >();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role === 'platform' || !user.club_id) {
      throw new ForbiddenException(
        'Este endpoint es del club, no de la plataforma',
      );
    }

    const expected = user.club_slug?.trim().toLowerCase();
    const headerSlug = (
      req.headers['x-club-slug'] as string | undefined
    )?.trim();
    if (headerSlug) {
      if (!expected || headerSlug.toLowerCase() !== expected) {
        throw new ForbiddenException(
          'El club del header no coincide con la sesión',
        );
      }
    }

    const originSlug =
      slugFromOrigin(req.headers.origin, tenantBaseDomain()) ||
      slugFromOrigin(req.headers.referer, tenantBaseDomain());
    if (originSlug && expected && originSlug !== expected) {
      throw new ForbiddenException(
        'El club del origen no coincide con la sesión',
      );
    }

    req.clubId = user.club_id;
    req.clubSlug = user.club_slug;
    return true;
  }
}
