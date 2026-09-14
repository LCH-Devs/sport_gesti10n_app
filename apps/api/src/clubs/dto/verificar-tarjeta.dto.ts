import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Payload que arma el SDK.js de MercadoPago en el navegador al tokenizar la tarjeta. */
export class VerificarTarjetaDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @MaxLength(40)
  payment_method_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  issuer_id?: string;

  @IsEmail()
  payer_email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  identification_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  identification_number?: string;
}
