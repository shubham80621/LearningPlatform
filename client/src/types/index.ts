export type UserRole = 'admin' | 'learner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  isPublished: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoredUpload {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}
