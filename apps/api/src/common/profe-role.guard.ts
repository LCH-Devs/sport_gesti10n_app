import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** Acceso al portal específico del profesor. */
@Injectable()
export class ProfeRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { role: string } }>();
    if (req.user?.role !== 'profe') {
      throw new ForbiddenException('Solo profesores');
    }
    return true;
  }
}
