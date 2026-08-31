import { HttpException, HttpStatus } from '@nestjs/common';
import { LOGIN_MAX_ATTEMPTS } from './auth-security';
import { LoginAttemptService } from './login-attempt.service';

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;

  beforeEach(() => {
    service = new LoginAttemptService();
  });

  it('deja pasar los primeros intentos', () => {
    expect(() => service.assertNotLocked('a@test.com')).not.toThrow();
  });

  it(`bloquea con 429 tras ${LOGIN_MAX_ATTEMPTS} fallos`, () => {
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      service.recordFailure('a@test.com');
    }
    try {
      service.assertNotLocked('a@test.com');
      fail('debía lanzar 429');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('normaliza el email (mayúsculas / espacios)', () => {
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      service.recordFailure('  A@Test.com ');
    }
    expect(() => service.assertNotLocked('a@test.com')).toThrow(HttpException);
  });

  it('un login ok limpia el contador', () => {
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS - 1; i++) {
      service.recordFailure('a@test.com');
    }
    service.recordSuccess('a@test.com');
    expect(() => service.assertNotLocked('a@test.com')).not.toThrow();
  });

  it('no comparte lockout entre emails', () => {
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      service.recordFailure('a@test.com');
    }
    expect(() => service.assertNotLocked('b@test.com')).not.toThrow();
  });
});
