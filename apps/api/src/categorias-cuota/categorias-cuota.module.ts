import { Module } from '@nestjs/common';
import { CategoriasCuotaController } from './categorias-cuota.controller';
import { CategoriasCuotaService } from './categorias-cuota.service';

@Module({
  controllers: [CategoriasCuotaController],
  providers: [CategoriasCuotaService],
  exports: [CategoriasCuotaService],
})
export class CategoriasCuotaModule {}
