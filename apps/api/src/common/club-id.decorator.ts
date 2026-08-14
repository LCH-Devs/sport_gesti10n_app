import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { TenantRequest } from './tenant.middleware';

/** Obtiene club_id del request (middleware) o del JWT. */
export const ClubId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest<
      TenantRequest & { user?: { club_id: number } }
    >();
    const id = req.user?.club_id ?? req.clubId;
    if (!id) {
      throw new BadRequestException(
        'Falta club (header X-Club-Slug o token con club_id)',
      );
    }
    return id;
  },
);
