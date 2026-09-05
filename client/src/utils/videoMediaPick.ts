import { readVideoDuration } from './media';
import {
  validateThumbnailFile,
  validateVideoSelection,
} from './mediaValidation';

export type ThumbnailPickResult =
  | { ok: true; file: File; previewUrl: string }
  | { ok: false; error: string };

export type VideoPickResult =
  | { ok: true; file: File; previewUrl: string; duration: number }
  | { ok: false; error: string };

/** Shared create/edit video thumbnail picker. */
export function pickThumbnail(file: File): ThumbnailPickResult {
  const error = validateThumbnailFile(file);
  if (error) return { ok: false, error };
  return { ok: true, file, previewUrl: URL.createObjectURL(file) };
}

/** Shared create/edit video file picker (reads duration). */
export async function pickVideo(file: File): Promise<VideoPickResult> {
  const selectionError = validateVideoSelection(file);
  if (selectionError) return { ok: false, error: selectionError };

  try {
    const duration = await readVideoDuration(file);
    return {
      ok: true,
      file,
      previewUrl: URL.createObjectURL(file),
      duration,
    };
  } catch {
    return {
      ok: false,
      error: 'Choose a valid video file. This one could not be read.',
    };
  }
}
