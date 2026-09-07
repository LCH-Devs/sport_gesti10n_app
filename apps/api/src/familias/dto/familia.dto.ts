import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateSocioDto } from '../../socios/dto/socio.dto';
import { AltaCobrosFields } from '../../pagos/dto/alta-cobros.dto';

export class CreateFamiliaDto extends AltaCobrosFields {
  @IsString()
  @MaxLength(80)
  nombre: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  titular_id?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSocioDto)
  titular?: CreateSocioDto;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  socio_ids?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateSocioDto)
  socios_nuevos?: CreateSocioDto[];

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  acepta_upgrade?: boolean;
}

export class UpdateFamiliaDto extends AltaCobrosFields {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  titular_id?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSocioDto)
  titular?: CreateSocioDto;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  socio_ids?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateSocioDto)
  socios_nuevos?: CreateSocioDto[];

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  acepta_upgrade?: boolean;
}
