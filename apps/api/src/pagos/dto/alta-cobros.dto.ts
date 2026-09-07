import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MES_MESSAGE, MES_REGEX } from '../../common/dto-constraints';

/** Campos opcionales de alta: inscripción y meses de cuota bonificados. */
export class AltaCobrosFields {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  inscripcion?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inscripcion_monto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  inscripcion_cuotas?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @Matches(MES_REGEX, { each: true, message: MES_MESSAGE })
  bonificar_meses?: string[];
}
