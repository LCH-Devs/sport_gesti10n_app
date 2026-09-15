import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly config: ConfigService) {}

  extForMime(mime: string) {
    return MIME_EXT[mime];
  }

  /** ImageKit si hay private key; si no, disco local (solo dev). */
  async saveClubLogo(clubId: number, file: Express.Multer.File): Promise<string> {
    const ext = this.extForMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException('Solo JPG, PNG, WEBP o GIF');
    }
    if (this.imagekitEnabled()) {
      return this.uploadToImageKit(`club-${clubId}`, '/clubapp/logos', file, ext);
    }
    this.logger.warn(
      'IMAGEKIT_PRIVATE_KEY no configurado: el logo se guarda en disco local',
    );
    return this.saveToDisk('logos', `club-${clubId}`, file, ext);
  }

  /**
   * Imagen genérica de una entidad (noticia, evento, etc.), con nombre único por
   * subida (a diferencia del logo, que siempre pisa el mismo archivo del club).
   */
  async saveEntityImage(
    category: string,
    entityId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Elegí una imagen');
    }
    if (file.size > 4 * 1024 * 1024) {
      throw new BadRequestException('La imagen no puede superar 4 MB');
    }
    const ext = this.extForMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException('Solo JPG, PNG, WEBP o GIF');
    }
    const baseName = `${category}-${entityId}-${Date.now()}`;
    if (this.imagekitEnabled()) {
      return this.uploadToImageKit(baseName, `/clubapp/${category}`, file, ext);
    }
    this.logger.warn(
      'IMAGEKIT_PRIVATE_KEY no configurado: la imagen se guarda en disco local',
    );
    return this.saveToDisk(category, baseName, file, ext);
  }

  private imagekitEnabled() {
    return !!(this.config.get<string>('IMAGEKIT_PRIVATE_KEY') || '').trim();
  }

  private async uploadToImageKit(
    fileNameBase: string,
    folder: string,
    file: Express.Multer.File,
    ext: string,
  ) {
    const privateKey = this.config.get<string>('IMAGEKIT_PRIVATE_KEY')!.trim();
    const fileName = `${fileNameBase}${ext}`;
    const auth = Buffer.from(`${privateKey}:`).toString('base64');

    const body = new FormData();
    body.append('file', file.buffer.toString('base64'));
    body.append('fileName', fileName);
    body.append('folder', folder);
    body.append('useUniqueFileName', 'false');

    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      body,
    });
    const data = (await res.json()) as {
      url?: string;
      message?: string;
    };
    if (!res.ok || !data.url) {
      this.logger.error(`ImageKit upload falló: ${data.message || res.status}`);
      throw new BadRequestException(
        data.message || 'No se pudo subir la imagen a ImageKit',
      );
    }
    this.logger.log(`Imagen ${fileName} subida a ImageKit`);
    return data.url;
  }

  private saveToDisk(
    subdir: string,
    fileNameBase: string,
    file: Express.Multer.File,
    ext: string,
  ) {
    const dir = join(process.cwd(), 'uploads', subdir);
    mkdirSync(dir, { recursive: true });
    for (const name of readdirSync(dir)) {
      if (name.startsWith(fileNameBase)) {
        try {
          unlinkSync(join(dir, name));
        } catch {
          /* ignore */
        }
      }
    }
    const filename = `${fileNameBase}${ext}`;
    writeFileSync(join(dir, filename), file.buffer);
    return `/uploads/${subdir}/${filename}`;
  }
}

