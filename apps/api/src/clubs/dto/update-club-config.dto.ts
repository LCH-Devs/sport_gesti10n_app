import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClubConfigDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cuota_monto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
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
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_reservas_activas?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cancelar_reserva_horas?: number;
}
