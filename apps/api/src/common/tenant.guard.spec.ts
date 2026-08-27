import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { TenantRequest } from './tenant.middleware';

function contextFor(
  user?: JwtPayload,
  headers: Record<string, string> = {},
  clubIdFromMiddleware?: number,
) {
  const req: TenantRequest & { user?: JwtPayload } = {
    user,
    headers,
    clubId: clubIdFromMiddleware,
  } as TenantRequest & { user?: JwtPayload };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
  return { ctx, req };
}

const adminA: JwtPayload = {
  sub: 10,
  role: 'admin',
  club_id: 1,
  club_slug: 'club-a',
};

describe('TenantGuard', () => {
  const guard = new TenantGuard();

  it('rechaza request sin usuario', () => {
    const { ctx } = contextFor(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('rechaza token de plataforma en endpoint de club', () => {
    const { ctx } = contextFor({ sub: 1, role: 'platform' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rechaza token de club sin club_id', () => {
    const { ctx } = contextFor({ sub: 2, role: 'admin' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('acepta JWT del club y pisa el club_id del middleware', () => {
    const { ctx, req } = contextFor(adminA, {}, 99);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.clubId).toBe(1);
    expect(req.clubSlug).toBe('club-a');
  });

  it('acepta X-Club-Slug si coincide con la sesión', () => {
    const { ctx, req } = contextFor(adminA, { 'x-club-slug': 'club-a' }, 99);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.clubId).toBe(1);
  });

  it('rechaza X-Club-Slug de otro club (Club A no puede hacerse pasar por B)', () => {
    const { ctx, req } = contextFor(adminA, { 'x-club-slug': 'club-b' }, 2);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(req.clubId).toBe(2);
  });

  it('acepta Origin del mismo club', () => {
    const { ctx } = contextFor(adminA, {
      origin: 'http://club-a.localhost:3000',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rechaza Origin de otro club', () => {
    const { ctx } = contextFor(adminA, {
      origin: 'http://club-b.localhost:3000',
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
