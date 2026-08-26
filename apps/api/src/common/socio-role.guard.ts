import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Login de socio (no comisión ni plataforma). */
@Injectable()
export class SocioRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { role: string } }>();
    if (req.user?.role !== 'socio' && req.user?.role !== 'profe') {
      throw new ForbiddenException('Solo socios');
    }
    return true;
  }
}
