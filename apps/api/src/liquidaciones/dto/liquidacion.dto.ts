import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCobroProfeDto {
  @Type(() => Number)
  @IsInt()
  actividad_id: number;

  @Type(() => Number)
  @IsInt()
  socio_id: number;

  @IsString()
  mes: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto_alumno: number;

  @IsOptional()
  @IsString()
  medio?: string;

  @IsOptional()
  @IsString()
  nota?: string;
}

export class CerrarMesDto {
  @IsString()
  mes: string;

  @Type(() => Number)
  @IsInt()
  profe_id: number;
}

