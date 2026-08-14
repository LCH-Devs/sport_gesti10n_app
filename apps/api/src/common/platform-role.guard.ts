import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Solo superadmin de plataforma ClubApp. */
@Injectable()
export class PlatformRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user?: { role: string };
    }>();
    if (req.user?.role !== 'platform') {
      throw new ForbiddenException('Solo superadmin de plataforma');
    }
    return true;
  }
}
