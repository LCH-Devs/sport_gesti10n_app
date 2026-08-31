import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsMesYm } from '../../common/dto-constraints';

export class CreateCobroProfeDto {
  @Type(() => Number)
  @IsInt()
  actividad_id: number;

  @Type(() => Number)
  @IsInt()
  socio_id: number;

  @IsMesYm()
  mes: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto_alumno: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  medio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nota?: string;
}

export class CerrarMesDto {
  @IsMesYm()
  mes: string;

  @Type(() => Number)
  @IsInt()
  profe_id: number;
}
