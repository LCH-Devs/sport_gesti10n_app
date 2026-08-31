import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  IsAppEmail,
  IsOptionalPersonName,
  IsOptionalStrongPassword,
  IsPersonName,
  IsStrongPassword,
} from '../../common/dto-constraints';

export class CreateAdminDto {
  @IsAppEmail()
  email: string;

  @IsPersonName()
  nombre: string;

  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsIn(['admin', 'entrada'])
  rol?: string;
}

export class UpdateAdminDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptional()
  @IsIn(['admin', 'entrada'])
  rol?: string;

  @IsOptionalStrongPassword()
  password?: string;
}

export class UpdateSelfDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  currentPassword?: string;

  @IsOptionalStrongPassword()
  newPassword?: string;
}
