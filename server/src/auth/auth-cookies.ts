import { CookieOptions, Response } from 'express';
import { parseDurationMs } from './auth-duration';

export const ACCESS_COOKIE = 'lp_access';
export const REFRESH_COOKIE = 'lp_refresh';

function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    // localhost:5173 → localhost:3000 is same-site (different origin/port).
    // Lax is enough for credentialed XHR/fetch between them.
    sameSite: 'lax',
    path: '/',
  };
}

export function accessCookieMaxAgeMs(): number {
  return parseDurationMs(
    process.env.JWT_ACCESS_EXPIRATION ||
      process.env.JWT_EXPIRATION ||
      '15m',
  );
}

export function refreshCookieMaxAgeMs(): number {
  return parseDurationMs(process.env.JWT_REFRESH_EXPIRATION || '7d');
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  const base = baseCookieOptions();
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: accessCookieMaxAgeMs(),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: refreshCookieMaxAgeMs(),
  });
}

export function clearAuthCookies(res: Response) {
  const base = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
