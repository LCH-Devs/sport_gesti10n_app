import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerarCobrosDto {
  /** Mes YYYY-MM. Si no viene, usa el mes actual. */
  @IsOptional()
  @IsString()
  mes?: string;

  /** Monto. Si no viene, usa Club.cuota_monto. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  monto?: number;
}
