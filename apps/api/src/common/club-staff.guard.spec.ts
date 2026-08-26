import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ClubStaffGuard } from './club-staff.guard';

function ctxFor(role?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as ExecutionContext;
}

describe('ClubStaffGuard', () => {
  const guard = new ClubStaffGuard();

  it('acepta admin y entrada', () => {
    expect(guard.canActivate(ctxFor('admin'))).toBe(true);
    expect(guard.canActivate(ctxFor('entrada'))).toBe(true);
  });

  it('rechaza socio y plataforma', () => {
    expect(() => guard.canActivate(ctxFor('socio'))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctxFor('platform'))).toThrow(
      ForbiddenException,
    );
  });
});
