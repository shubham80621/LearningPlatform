import api from './client';
import type { StoredUpload } from '../types';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<StoredUpload>('/uploads/image', form, {
    timeout: 2 * 60 * 1000,
  });
  return data;
}

export async function uploadVideo(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<StoredUpload>('/uploads/video', form, {
    timeout: 10 * 60 * 1000,
  });
  return data;
}
