import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  IsAppEmail,
  IsOptionalColorHex,
  IsOptionalPersonName,
  IsOptionalStrongPassword,
  IsPersonName,
  IsStrongPassword,
} from '../../common/dto-constraints';

export class CreateClubPlatformDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @IsAppEmail()
  admin_email: string;

  @IsOptionalPersonName()
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
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string | null;

  @IsOptionalColorHex()
  color_primario?: string;

  @IsOptionalColorHex()
  color_secundario?: string;

  @IsOptionalColorHex()
  color_terciario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  deportes?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  descuento_familiar_pct?: number;
}

export class CreateClubAdminDto {
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

export class CreatePlatformAdminDto {
  @IsAppEmail()
  email: string;

  @IsPersonName()
  nombre: string;

  @IsStrongPassword()
  password: string;
}

export class UpdateSelfPlatformAdminDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  currentPassword?: string;

  @IsOptionalStrongPassword()
  newPassword?: string;
}

export class UpdatePlatformAdminDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptionalStrongPassword()
  password?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
