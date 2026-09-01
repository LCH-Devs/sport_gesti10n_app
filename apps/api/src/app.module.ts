import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { SociosModule } from './socios/socios.module';
import { AdminsModule } from './admins/admins.module';
import { PagosModule } from './pagos/pagos.module';
import { ReportesModule } from './reportes/reportes.module';
import { EspaciosModule } from './espacios/espacios.module';
import { ReservasModule } from './reservas/reservas.module';
import { HorariosModule } from './horarios/horarios.module';
import { NoticiasModule } from './noticias/noticias.module';
import { FamiliasModule } from './familias/familias.module';
import { ActividadesModule } from './actividades/actividades.module';
import { LiquidacionesModule } from './liquidaciones/liquidaciones.module';
import { TorneosModule } from './torneos/torneos.module';
import { PlatformModule } from './platform/platform.module';
import { SocialModule } from './social/social.module';
import { HealthController } from './health.controller';
import { TenantMiddleware } from './common/tenant.middleware';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClubsModule,
    SociosModule,
    AdminsModule,
    PagosModule,
    ReportesModule,
    EspaciosModule,
    ReservasModule,
    HorariosModule,
    NoticiasModule,
    FamiliasModule,
    ActividadesModule,
    LiquidacionesModule,
    TorneosModule,
    PlatformModule,
    SocialModule,
  ],
  controllers: [HealthController],
  providers: [TenantMiddleware, RequestLoggerMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware, TenantMiddleware).forRoutes('*');
  }
}

