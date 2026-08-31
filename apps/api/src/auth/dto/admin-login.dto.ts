import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsAppEmail } from '../../common/dto-constraints';

export class AdminLoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  club_slug?: string;

  @IsAppEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(72)
  password: string;
}
