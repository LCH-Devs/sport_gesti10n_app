import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  /** Si falta, se resuelve el club por email + password. */
  @IsOptional()
  @IsString()
  club_slug?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  password: string;
}
