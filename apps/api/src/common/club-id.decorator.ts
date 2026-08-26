import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';
import { TenantRequest } from './tenant.middleware';

/** club_id de la sesión (JWT). Nunca del header. */
export const ClubId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest<
      TenantRequest & { user?: JwtPayload }
    >();
    if (req.user?.role === 'platform') {
      throw new ForbiddenException(
        'Este endpoint es del club, no de la plataforma',
      );
    }
    const id = req.user?.club_id;
    if (!id) {
      throw new ForbiddenException('Falta club_id en la sesión');
    }
    return id;
  },
);
