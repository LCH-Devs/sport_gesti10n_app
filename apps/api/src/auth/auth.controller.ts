import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PlatformLoginDto } from './dto/platform-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.auth.loginAdmin(dto);
  }

  @Post('platform/login')
  loginPlatform(@Body() dto: PlatformLoginDto) {
    return this.auth.loginPlatform(dto);
  }
}
