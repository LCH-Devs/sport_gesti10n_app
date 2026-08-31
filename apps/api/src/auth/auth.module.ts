import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LoginAttemptService } from './login-attempt.service';
import {
  JWT_EXPIRES_IN,
  LOGIN_IP_LIMIT,
  LOGIN_IP_TTL_MS,
  LOGIN_RATE_LIMIT_MESSAGE,
} from './auth-security';

@Module({
  imports: [
    PassportModule,
    ThrottlerModule.forRoot({
      errorMessage: LOGIN_RATE_LIMIT_MESSAGE,
      throttlers: [{ ttl: LOGIN_IP_TTL_MS, limit: LOGIN_IP_LIMIT }],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev-secret',
        signOptions: { expiresIn: JWT_EXPIRES_IN },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LoginAttemptService],
  exports: [AuthService],
})
export class AuthModule {}

