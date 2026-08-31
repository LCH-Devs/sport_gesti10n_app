import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { SocioLoginDto } from './dto/socio-login.dto';
import { SwitchCuentaDto } from './dto/switch-cuenta.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtUser } from '../common/jwt-user.decorator';
import { JwtPayload } from './jwt.strategy';
import { LoginResponseDto } from './dto/login-response.dto';
import { LOGIN_IP_LIMIT, LOGIN_IP_TTL_MS } from './auth-security';

@Controller('auth')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: LOGIN_IP_LIMIT, ttl: LOGIN_IP_TTL_MS } })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto);
  }

  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto): Promise<LoginResponseDto> {
    return this.auth.loginAdmin(dto);
  }

  @Post('socio/login')
  loginSocio(@Body() dto: SocioLoginDto): Promise<LoginResponseDto> {
    return this.auth.loginSocio(dto);
  }

  @SkipThrottle()
  @Post('switch')
  @UseGuards(JwtAuthGuard)
  switchCuenta(
    @JwtUser() user: JwtPayload,
    @Body() dto: SwitchCuentaDto,
  ): Promise<LoginResponseDto> {
    return this.auth.switchCuenta(user, dto.membresia_id);
  }

  @Post('platform/login')
  loginPlatform(@Body() dto: PlatformLoginDto) {
    return this.auth.loginPlatform(dto);
  }
}
