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
    const req = context.switchToHttp().getRequest<{
      user?: { role: string; es_socio?: boolean };
    }>();
    const user = req.user;
    if (
      user?.role !== 'socio' &&
      !(user?.role === 'profe' && user.es_socio === true)
    ) {
      throw new ForbiddenException('Solo socios');
    }
    return true;
  }
}
