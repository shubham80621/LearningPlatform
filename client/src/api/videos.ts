import api from './client';
import type { Video } from '../types';

export async function listVideos() {
  const { data } = await api.get<Video[]>('/videos');
  return data;
}

export async function createVideo(payload: {
  title: string;
  description: string;
  duration: number;
  thumbnail: File;
  video: File;
}) {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('duration', String(payload.duration));
  form.append('thumbnail', payload.thumbnail);
  form.append('video', payload.video);
  const { data } = await api.post<Video>('/videos', form, {
    timeout: 10 * 60 * 1000,
  });
  return data;
}

export async function getVideo(id: string) {
  const { data } = await api.get<Video>(`/videos/${id}`);
  return data;
}

export async function updateVideo(
  id: string,
  payload: {
    title: string;
    description: string;
    duration?: number;
    thumbnail?: File | null;
    video?: File | null;
  },
) {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('description', payload.description);
  if (payload.duration) {
    form.append('duration', String(payload.duration));
  }
  if (payload.thumbnail) {
    form.append('thumbnail', payload.thumbnail);
  }
  if (payload.video) {
    form.append('video', payload.video);
  }
  const { data } = await api.patch<Video>(`/videos/${id}`, form, {
    timeout: 10 * 60 * 1000,
  });
  return data;
}

export async function setVideoPublished(id: string, isPublished: boolean) {
  const path = isPublished ? `/videos/${id}/publish` : `/videos/${id}/unpublish`;
  const { data } = await api.post<Video>(path);
  return data;
}
