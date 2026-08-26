import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const STAFF_ROLES = new Set(['admin', 'entrada']);

/** Comisión del club (admin o entrada). No socios. */
@Injectable()
export class ClubStaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { role: string } }>();
    if (!req.user?.role || !STAFF_ROLES.has(req.user.role)) {
      throw new ForbiddenException('Solo la comisión del club');
    }
    return true;
  }
}
