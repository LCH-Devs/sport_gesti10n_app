import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { IsOptionalColorHex } from '../../common/dto-constraints';

export class UpdateClubConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string;

  @IsOptionalColorHex()
  color_primario?: string;

  @IsOptionalColorHex()
  color_secundario?: string;

  @IsOptionalColorHex()
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
