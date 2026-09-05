/**
 * Rate-limit knobs (env-overridable).
 * Auth is intentionally tighter than the general API to slow credential stuffing.
 */
export function throttlerLimits() {
  const ttl = Number(process.env.THROTTLE_TTL_MS || 60_000);
  return {
    ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : 60_000,
    defaultLimit: Number(process.env.THROTTLE_LIMIT || 120) || 120,
    authLimit: Number(process.env.THROTTLE_AUTH_LIMIT || 5) || 5,
    uploadLimit: Number(process.env.THROTTLE_UPLOAD_LIMIT || 30) || 30,
  };
}
