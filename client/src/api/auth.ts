import axios from 'axios';
import api from './client';
import type { AuthResponse, User } from '../types';

const apiBase = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function meRequest() {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

/** No interceptors — logout should not trigger refresh-on-401. */
export async function logoutRequest() {
  await axios.post(
    `${apiBase}/auth/logout`,
    {},
    { withCredentials: true },
  );
}
