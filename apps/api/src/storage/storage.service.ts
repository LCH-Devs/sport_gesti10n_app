import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

let S3Client: any = null;
let DeleteObjectsCommand: any = null;
let ListObjectsV2Command: any = null;
let PutObjectCommand: any = null;

try {
  const aws = require('@aws-sdk/client-s3');
  S3Client = aws.S3Client;
  DeleteObjectsCommand = aws.DeleteObjectsCommand;
  ListObjectsV2Command = aws.ListObjectsV2Command;
  PutObjectCommand = aws.PutObjectCommand;
} catch {
  // AWS SDK optional - only needed if S3 is configured
}

const LOCAL_PREFIX = '/uploads/logos/';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: any;
  private readonly bucket: string;
  private readonly publicBase: string;
  private readonly localDir = join(process.cwd(), 'uploads', 'logos');

  constructor(private readonly config: ConfigService) {
    const bucket = this.config.get<string>('S3_BUCKET')?.trim() || '';
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY')?.trim() || '';
    const secretAccessKey =
      this.config.get<string>('S3_SECRET_KEY')?.trim() || '';
    this.bucket = bucket;
    this.publicBase = (
      this.config.get<string>('S3_PUBLIC_URL') || ''
    ).replace(/\/$/, '');

    if (bucket && accessKeyId && secretAccessKey) {
      const endpoint = this.config.get<string>('S3_ENDPOINT')?.trim() || undefined;
      this.s3 = new S3Client({
        region: this.config.get<string>('S3_REGION')?.trim() || 'auto',
        endpoint,
        forcePathStyle:
          this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true' || !!endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(
        `Logos en object storage (${bucket}). La DB solo guarda la URL.`,
      );
    } else {
      this.s3 = null;
      this.logger.warn(
        'Sin S3_BUCKET/S3_ACCESS_KEY: logos en disco local (solo desarrollo).',
      );
    }
  }

  usesObjectStorage() {
    return !!this.s3;
  }

  async saveClubLogo(
    clubId: number,
    buffer: Buffer,
    ext: string,
    mime: string,
  ): Promise<string> {
    await this.deleteClubLogos(clubId);
    const filename = `club-${clubId}-${Date.now()}${ext}`;

    if (this.s3) {
      const key = `logos/${filename}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      if (!this.publicBase) {
        this.logger.warn('S3_PUBLIC_URL no está seteado; las <img> pueden fallar');
      }
      return this.publicBase ? `${this.publicBase}/${key}` : key;
    }

    mkdirSync(this.localDir, { recursive: true });
    writeFileSync(join(this.localDir, filename), buffer);
    return `${LOCAL_PREFIX}${filename}`;
  }

  async deleteClubLogos(clubId: number) {
    const prefix = `club-${clubId}-`;
    if (this.s3) {
      const listed = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `logos/${prefix}`,
        }),
      );
      const keys = (listed.Contents || [])
        .map((obj: any) => obj.Key)
        .filter((key: any): key is string => !!key);
      if (keys.length) {
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: keys.map((Key: string) => ({ Key })) },
          }),
        );
      }
      return;
    }

    mkdirSync(this.localDir, { recursive: true });
    for (const name of readdirSync(this.localDir)) {
      if (!name.startsWith(prefix)) continue;
      try {
        unlinkSync(join(this.localDir, name));
      } catch {
        /* ignore */
      }
    }
  }
}

