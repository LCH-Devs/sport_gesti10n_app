import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  club_slug: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  password: string;
}

