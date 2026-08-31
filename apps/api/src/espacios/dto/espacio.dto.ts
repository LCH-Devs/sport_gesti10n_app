import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsOptionalHoraHm } from '../../common/dto-constraints';

const ESPACIO_TIPOS = [
  'padel',
  'futbol',
  'basquet',
  'tenis',
  'quincho',
  'salon',
  'cancha',
  'otro',
] as const;

export class CreateEspacioDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsIn([...ESPACIO_TIPOS])
  tipo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
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

  @IsOptionalHoraHm()
  hora_apertura?: string;

  @IsOptionalHoraHm()
  hora_cierre?: string;
}

export class UpdateEspacioDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsIn([...ESPACIO_TIPOS])
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
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

  @IsOptionalHoraHm()
  hora_apertura?: string;

  @IsOptionalHoraHm()
  hora_cierre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
