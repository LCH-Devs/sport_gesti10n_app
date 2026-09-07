import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsPersonName } from '../../common/dto-constraints';

export class CreateCategoriaCuotaDto {
  @IsPersonName()
  nombre!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto!: number;
}

export class UpdateCategoriaCuotaDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;
}

export class OnboardingCategoriaDto {
  @IsPersonName()
  nombre!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto!: number;
}
