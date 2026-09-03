import { config } from 'dotenv';
import { join } from 'path';

config();

/**
 * Local upload limits for the MVP.
 *
 * Industry notes for larger files:
 * - API-proxied uploads (this approach) are fine for small/medium assets.
 * - For large videos (hundreds of MB+), production systems usually use
 *   **presigned URLs** so the client uploads directly to S3/GCS, then the API
 *   only stores the resulting object key/URL. That avoids Node memory/timeouts
 *   and scales better. Chunked/multipart upload is used for very large objects.
 *
 * TODO: replace local disk storage with AWS S3 (or similar) via UploadService.
 */
export const UPLOAD_ROOT = join(process.cwd(), 'uploads');
export const IMAGE_UPLOAD_DIR = join(UPLOAD_ROOT, 'images');
export const VIDEO_UPLOAD_DIR = join(UPLOAD_ROOT, 'videos');

/** Default: 5 MB thumbnails */
export const MAX_IMAGE_SIZE_BYTES =
  Number(process.env.MAX_IMAGE_SIZE_BYTES) || 5 * 1024 * 1024;

/** Default: 200 MB videos — raise carefully; prefer S3 direct upload beyond this */
export const MAX_VIDEO_SIZE_BYTES =
  Number(process.env.MAX_VIDEO_SIZE_BYTES) || 200 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export type UploadKind = 'image' | 'video';

/** Browser-facing origin for local files. Later this becomes the CloudFront/S3 base URL. */
export const PUBLIC_APP_URL = (
  process.env.PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`
).replace(/\/$/, '');

export function toPublicMediaUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${PUBLIC_APP_URL}${path}`;
}

/** Persist only /uploads/... so the DB is not tied to localhost. */
export function toStoredMediaPath(pathOrUrl?: string | null) {
  if (!pathOrUrl) return '';
  const uploadsIndex = pathOrUrl.indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return pathOrUrl.slice(uploadsIndex);
  }
  return pathOrUrl;
}
