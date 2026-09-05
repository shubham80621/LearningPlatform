import type { User } from '../types';

const USER_KEY = 'user';

/** Non-secret UI profile cache only — tokens live in HttpOnly cookies. */
export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  // Clear legacy token keys from older builds.
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}
