import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { MercadoPagoService } from './mercadopago.service';

@Module({
  controllers: [PagosController],
  providers: [PagosService, MercadoPagoService],
  exports: [PagosService],
})
export class PagosModule {}

