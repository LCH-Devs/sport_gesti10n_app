import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsOptionalMesYm } from '../../common/dto-constraints';

export class GenerarCobrosDto {
  @IsOptionalMesYm()
  mes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  monto?: number;
}
