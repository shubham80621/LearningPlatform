import { extname } from 'path';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  IMAGE_UPLOAD_DIR,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  UploadKind,
  VIDEO_UPLOAD_DIR,
} from './upload.constants';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];

function uniqueFilename(
  _req: unknown,
  file: { originalname: string },
  cb: (error: Error | null, filename: string) => void,
) {
  const safeExt = extname(file.originalname).toLowerCase() || '';
  cb(null, `${randomUUID()}${safeExt}`);
}

function isAllowedFile(
  file: { originalname: string; mimetype: string },
  kind: UploadKind,
) {
  const allowedMime = kind === 'image' ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_VIDEO_MIME_TYPES;
  const allowedExt = kind === 'image' ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  const ext = extname(file.originalname).toLowerCase();
  const mimeOk = (allowedMime as readonly string[]).includes(file.mimetype);
  return mimeOk || allowedExt.includes(ext);
}

/**
 * Multer writes to local disk for now.
 * Later: replace `diskStorage` with an S3 storage engine (or skip Multer and
 * return a presigned S3 PUT URL from UploadService).
 */
export function createMulterOptions(kind: UploadKind): MulterOptions {
  const isImage = kind === 'image';
  return {
    storage: diskStorage({
      destination: isImage ? IMAGE_UPLOAD_DIR : VIDEO_UPLOAD_DIR,
      filename: uniqueFilename,
    }),
    limits: {
      fileSize: isImage ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES,
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      if (!isAllowedFile(file, kind)) {
        cb(
          new Error(
            isImage
              ? 'Unsupported thumbnail. Use a JPEG, PNG, WebP, or GIF image.'
              : 'Unsupported video. Use an MP4, WebM, or MOV file.',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

/** Used when creating/updating a video with thumbnail + video in one multipart request. */
export function createLessonMediaMulterOptions(): MulterOptions {
  return {
    storage: diskStorage({
      destination: (_req, file, cb) => {
        cb(null, file.fieldname === 'thumbnail' ? IMAGE_UPLOAD_DIR : VIDEO_UPLOAD_DIR);
      },
      filename: uniqueFilename,
    }),
    limits: { fileSize: MAX_VIDEO_SIZE_BYTES, files: 2 },
    fileFilter: (_req, file, cb) => {
      if (file.fieldname === 'thumbnail') {
        if (!isAllowedFile(file, 'image')) {
          cb(new Error('Unsupported thumbnail. Use a JPEG, PNG, WebP, or GIF image.'), false);
          return;
        }
        cb(null, true);
        return;
      }
      if (file.fieldname === 'video') {
        if (!isAllowedFile(file, 'video')) {
          cb(new Error('Unsupported video. Use an MP4, WebM, or MOV file.'), false);
          return;
        }
        cb(null, true);
        return;
      }
      cb(new Error('Unexpected file field.'), false);
    },
  };
}
