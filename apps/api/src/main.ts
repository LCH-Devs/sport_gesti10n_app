import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import {
  corsAllowlistFromEnv,
  isAllowedBrowserOrigin,
  tenantBaseFromWebUrl,
} from './common/tenant-host';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.set('trust proxy', 1);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const extraOrigins = corsAllowlistFromEnv(
    process.env.CORS_ORIGIN,
    process.env.WEB_APP_URL,
  );
  const baseDomain =
    process.env.TENANT_BASE_DOMAIN ||
    tenantBaseFromWebUrl(process.env.WEB_APP_URL || 'http://localhost:3000');
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      cb(null, isAllowedBrowserOrigin(origin, extraOrigins, baseDomain));
    },
    credentials: true,
  });
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`API ClubApp escuchando en http://localhost:${port}`);
}
bootstrap();

