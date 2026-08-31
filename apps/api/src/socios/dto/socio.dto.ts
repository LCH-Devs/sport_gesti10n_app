import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  IsAppEmail,
  IsDni,
  IsOptionalPersonName,
  IsOptionalStrongPassword,
  IsPersonName,
} from '../../common/dto-constraints';

export class CreateSocioDto {
  @IsDni()
  dni: string;

  @IsPersonName()
  nombre: string;

  @IsPersonName()
  apellido: string;

  @IsAppEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptionalStrongPassword()
  password?: string;

  @IsOptional()
  @IsIn(['socio', 'profe'])
  rol?: string;

  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;
}

export class UpdateSelfSocioDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptionalPersonName()
  apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  currentPassword?: string;

  @IsOptionalStrongPassword()
  newPassword?: string;
}

export class UpdateSocioDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptionalPersonName()
  apellido?: string;

  @IsOptional()
  @IsAppEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsIn(['activo', 'moroso', 'suspendido'])
  estado?: string;

  @IsOptional()
  @IsIn(['socio', 'profe'])
  rol?: string;

  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;
}
