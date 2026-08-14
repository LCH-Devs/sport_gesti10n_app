import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActividadDto {
  @IsString()
  nombre: string;

  @IsIn(['club', 'profe'])
  modo_cobro: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto_adicional?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  profe_id?: number;

  @IsOptional()
  @IsIn(['porcentaje', 'fijo'])
  comision_tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  comision_valor?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateActividadDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsIn(['club', 'profe'])
  modo_cobro?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto_adicional?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  profe_id?: number | null;

  @IsOptional()
  @IsIn(['porcentaje', 'fijo'])
  comision_tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  comision_valor?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class SetSociosActividadDto {
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  socio_ids: number[];
}
