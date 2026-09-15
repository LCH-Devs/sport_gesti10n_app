import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ProfeRoleGuard } from './profe-role.guard';
import { SocioRoleGuard } from './socio-role.guard';

function context(user: { role: string; es_socio?: boolean }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('guards de portales socio/profe', () => {
  const socioGuard = new SocioRoleGuard();
  const profeGuard = new ProfeRoleGuard();

  it('un socio normal entra solo al portal socio', () => {
    expect(socioGuard.canActivate(context({ role: 'socio', es_socio: true }))).toBe(true);
    expect(() => profeGuard.canActivate(context({ role: 'socio', es_socio: true })))
      .toThrow(ForbiddenException);
  });

  it('un profesor que también es socio entra a ambos portales', () => {
    const user = context({ role: 'profe', es_socio: true });
    expect(socioGuard.canActivate(user)).toBe(true);
    expect(profeGuard.canActivate(user)).toBe(true);
  });

  it('un profesor contratado entra solo al portal profesor', () => {
    const user = context({ role: 'profe', es_socio: false });
    expect(() => socioGuard.canActivate(user)).toThrow(ForbiddenException);
    expect(profeGuard.canActivate(user)).toBe(true);
  });
});
