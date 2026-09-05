import axios from 'axios';
import type { AuthResponse } from '../types';
import { clearSession } from './authStorage';

const apiBase = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

/** Bare client — credentials on, no interceptors — so refresh cannot recurse. */
const refreshClient = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

/**
 * Single-flight refresh: concurrent 401s share one POST /auth/refresh.
 * Refresh token is the HttpOnly cookie — never read from JS.
 */
let inflight: Promise<void> | null = null;

export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export async function refreshAccessToken(): Promise<void> {
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      await refreshClient.post<AuthResponse>('/auth/refresh', {});
    } catch (error) {
      clearSession();
      throw error instanceof SessionExpiredError
        ? error
        : new SessionExpiredError('Refresh failed');
    }
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path === '/login' || path.startsWith('/login?')) return;
  window.location.assign('/login');
}

/** Paths that must never trigger refresh-on-401. */
export function isAuthPublicUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}
