import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Solo rol admin (comisión), no entrada. */
@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { role: string } }>();
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Solo administradores del club');
    }
    return true;
  }
}
