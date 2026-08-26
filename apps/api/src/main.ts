import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import {
  isAllowedBrowserOrigin,
  tenantBaseFromWebUrl,
} from './common/tenant-host';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const extraOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const baseDomain =
    process.env.TENANT_BASE_DOMAIN ||
    tenantBaseFromWebUrl(process.env.WEB_APP_URL || 'http://localhost:3000');
  app.enableCors({
    origin: extraOrigins.length
      ? (origin, cb) => {
          if (!origin) {
            cb(null, true);
            return;
          }
          cb(null, isAllowedBrowserOrigin(origin, extraOrigins, baseDomain));
        }
      : true,
    credentials: true,
  });
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`API ClubApp escuchando en http://localhost:${port}`);
}
bootstrap();

