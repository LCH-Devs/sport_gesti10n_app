import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class SwitchCuentaDto {
  @Type(() => Number)
  @IsInt()
  membresia_id: number;
}
