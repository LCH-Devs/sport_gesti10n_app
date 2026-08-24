import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEspacioDto {
  @IsString()
  nombre: string;

  @IsString()
  tipo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  duracion_slot_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_opcional?: number;

  @IsOptional()
  @IsString()
  hora_apertura?: string;

  @IsOptional()
  @IsString()
  hora_cierre?: string;
}

export class UpdateEspacioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  duracion_slot_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_opcional?: number;

  @IsOptional()
  @IsString()
  hora_apertura?: string;

  @IsOptional()
  @IsString()
  hora_cierre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

