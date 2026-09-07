import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlanTramoItemDto {
  @IsString()
  @MaxLength(80)
  nombre: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  desde: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hasta?: number | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_usd: number;
}

export class ReplacePlanTramosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PlanTramoItemDto)
  tramos: PlanTramoItemDto[];
}
