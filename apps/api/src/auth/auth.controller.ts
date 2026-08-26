import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { SocioLoginDto } from './dto/socio-login.dto';
import { SwitchCuentaDto } from './dto/switch-cuenta.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtUser } from '../common/jwt-user.decorator';
import { JwtPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto);
  }

  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.auth.loginAdmin(dto);
  }

  @Post('socio/login')
  loginSocio(@Body() dto: SocioLoginDto) {
    return this.auth.loginSocio(dto);
  }

  @Post('switch')
  @UseGuards(JwtAuthGuard)
  switchCuenta(@JwtUser() user: JwtPayload, @Body() dto: SwitchCuentaDto) {
    return this.auth.switchCuenta(user, dto.membresia_id);
  }

  @Post('platform/login')
  loginPlatform(@Body() dto: PlatformLoginDto) {
    return this.auth.loginPlatform(dto);
  }
}
