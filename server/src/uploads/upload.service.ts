import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  IMAGE_UPLOAD_DIR,
  toPublicMediaUrl,
  toStoredMediaPath,
  UPLOAD_ROOT,
  UploadKind,
  VIDEO_UPLOAD_DIR,
} from './upload.constants';

export type StoredUpload = {
  /** Public URL path served by the static middleware, e.g. /uploads/images/abc.jpg */
  url: string;
  /** Relative path under uploads/, useful if migrating to object storage keys later */
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
};

/**
 * Local-disk upload storage for the interview MVP.
 *
 * Swap this service later for an AWS S3 (or GCS) implementation that:
 * 1) generates a presigned PUT URL for the client, or
 * 2) streams the multipart body to S3 PutObject / multipart upload,
 * then returns a CloudFront/S3 URL instead of /uploads/...
 */
@Injectable()
export class UploadService implements OnModuleInit {
  onModuleInit() {
    this.ensureDirectories();
  }

  ensureDirectories() {
    for (const dir of [IMAGE_UPLOAD_DIR, VIDEO_UPLOAD_DIR]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  toStoredUpload(file: Express.Multer.File, kind: UploadKind): StoredUpload {
    if (!file) {
      throw new BadRequestException(`A ${kind} file is required`);
    }

    const folder = kind === 'image' ? 'images' : 'videos';
    const key = `${folder}/${file.filename}`;

    return {
      url: toPublicMediaUrl(`/uploads/${key}`),
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /** Best-effort cleanup when a video is deleted or a file is replaced. */
  deleteByUrl(url?: string | null) {
    const storedPath = toStoredMediaPath(url);
    if (!storedPath.startsWith('/uploads/')) {
      return;
    }

    const relative = storedPath.replace(/^\/uploads\//, '');
    if (!relative || relative.includes('..')) {
      return;
    }

    const absolute = join(UPLOAD_ROOT, relative);

    try {
      if (existsSync(absolute)) {
        unlinkSync(absolute);
      }
    } catch {
      // Ignore missing files / race conditions during cleanup.
    }
  }
}
