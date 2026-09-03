import api from './client';
import type { AuthResponse, User } from '../types';

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function getMe() {
  const { data } = await api.get<User>('/auth/me');
  return data;
}
