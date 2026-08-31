import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  LOGIN_LOCK_MS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_MESSAGE,
} from './auth-security';

type AttemptRow = {
  count: number;
  firstAt: number;
  lockedUntil?: number;
};

@Injectable()
export class LoginAttemptService {
  private readonly attempts = new Map<string, AttemptRow>();

  assertNotLocked(email: string) {
    const key = this.key(email);
    this.purge(key);
    const row = this.attempts.get(key);
    if (row?.lockedUntil && row.lockedUntil > Date.now()) {
      throw new HttpException(
        LOGIN_RATE_LIMIT_MESSAGE,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(email: string) {
    const key = this.key(email);
    this.purge(key);
    const now = Date.now();
    const row = this.attempts.get(key);
    if (!row) {
      this.attempts.set(key, { count: 1, firstAt: now });
      return;
    }
    row.count += 1;
    if (row.count >= LOGIN_MAX_ATTEMPTS) {
      row.lockedUntil = now + LOGIN_LOCK_MS;
    }
  }

  recordSuccess(email: string) {
    this.attempts.delete(this.key(email));
  }

  private key(email: string) {
    return email.toLowerCase().trim();
  }

  private purge(key: string) {
    const row = this.attempts.get(key);
    if (!row) return;
    const now = Date.now();
    if (row.lockedUntil && row.lockedUntil <= now) {
      this.attempts.delete(key);
      return;
    }
    if (!row.lockedUntil && now - row.firstAt > LOGIN_LOCK_MS) {
      this.attempts.delete(key);
    }
  }
}
