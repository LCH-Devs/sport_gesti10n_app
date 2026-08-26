import {
  applyDecorators,
  CanActivate,
  Type,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from './tenant.guard';

/** JWT + aislamiento de tenant. Guards extra (p. ej. AdminRoleGuard) van después. */
export function UseClubAuth(...extra: Array<Type<CanActivate>>) {
  return applyDecorators(UseGuards(JwtAuthGuard, TenantGuard, ...extra));
}
