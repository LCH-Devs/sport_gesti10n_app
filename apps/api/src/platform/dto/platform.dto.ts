import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClubPlatformDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  admin_email: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  admin_nombre?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio_usd_mes: number;
}

export class UpdateClubPlatformDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  logo_url?: string | null;

  @IsOptional()
  @IsString()
  color_primario?: string;

  @IsOptional()
  @IsString()
  color_secundario?: string;

  @IsOptional()
  @IsString()
  color_terciario?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cuota_monto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio_usd_mes?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsNumber()
  regla_moroso_cuotas?: number;

  @IsOptional()
  @IsBoolean()
  bloquear_reservas?: boolean;

  @IsOptional()
  @IsBoolean()
  bloquear_entrada?: boolean;

  @IsOptional()
  @IsBoolean()
  cumples_auto?: boolean;

  @IsOptional()
  @IsNumber()
  max_reservas_activas?: number;

  @IsOptional()
  @IsNumber()
  cancelar_reserva_horas?: number;
}

export class CreateClubAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  rol?: string;
}

export class CreatePlatformAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateSelfPlatformAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}

export class UpdatePlatformAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

