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
      return this.uploadToImageKit(clubId, file, ext);
    }
    this.logger.warn(
      'IMAGEKIT_PRIVATE_KEY no configurado: el logo se guarda en disco local',
    );
    return this.saveToDisk(clubId, file, ext);
  }

  private imagekitEnabled() {
    return !!(this.config.get<string>('IMAGEKIT_PRIVATE_KEY') || '').trim();
  }

  private async uploadToImageKit(
    clubId: number,
    file: Express.Multer.File,
    ext: string,
  ) {
    const privateKey = this.config.get<string>('IMAGEKIT_PRIVATE_KEY')!.trim();
    const folder =
      this.config.get<string>('IMAGEKIT_FOLDER')?.trim() || '/clubapp/logos';
    const fileName = `club-${clubId}${ext}`;
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
        data.message || 'No se pudo subir el logo a ImageKit',
      );
    }
    this.logger.log(`Logo club ${clubId} subido a ImageKit`);
    return data.url;
  }

  private saveToDisk(
    clubId: number,
    file: Express.Multer.File,
    ext: string,
  ) {
    const dir = join(process.cwd(), 'uploads', 'logos');
    mkdirSync(dir, { recursive: true });
    for (const name of readdirSync(dir)) {
      if (name.startsWith(`club-${clubId}-`)) {
        try {
          unlinkSync(join(dir, name));
        } catch {
          /* ignore */
        }
      }
    }
    const filename = `club-${clubId}-${Date.now()}${ext}`;
    writeFileSync(join(dir, filename), file.buffer);
    return `/uploads/logos/${filename}`;
  }
}

