import api from './client';
import type { AuthResponse } from '../types';

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}
