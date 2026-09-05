/** Client-side upload size limits (keep in sync with server defaults). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];

function fileExtension(name: string) {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

export function validateThumbnailFile(file: File | null) {
  if (!file) return 'A thumbnail image is required.';
  if (file.size <= 0) return 'Thumbnail file is empty.';
  const extOk = IMAGE_EXTENSIONS.includes(fileExtension(file.name));
  const mimeOk = IMAGE_TYPES.includes(file.type);
  if (!mimeOk && !extOk) return 'Use a JPEG, PNG, WebP, or GIF image.';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'Thumbnail must be 5 MB or smaller.';
  return '';
}

export function validateVideoSelection(file: File | null) {
  if (!file) return 'A video file is required.';
  if (file.size <= 0) return 'Video file is empty.';
  const extOk = VIDEO_EXTENSIONS.includes(fileExtension(file.name));
  const mimeOk = VIDEO_TYPES.includes(file.type);
  if (!mimeOk && !extOk) return 'Use an MP4, WebM, or MOV video.';
  if (file.size > MAX_VIDEO_SIZE_BYTES) return 'Video must be 200 MB or smaller.';
  return '';
}

export function validateVideoFile(file: File | null, duration = 0) {
  const selectionError = validateVideoSelection(file);
  if (selectionError) return selectionError;
  if (duration < 1) return 'Choose a valid video file. This one could not be read.';
  return '';
}

export function validateRequiredText(value: string, label: string, min = 2) {
  if (!value.trim()) return `${label} is required.`;
  if (value.trim().length < min) return `${label} must be at least ${min} characters.`;
  return '';
}
