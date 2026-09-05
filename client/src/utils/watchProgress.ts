/**
 * Event-based watch progress (industry-style).
 * Buffer locally; flush on pause/seek/end/leave — not on every timeupdate.
 * Unload uses fetch keepalive (sendBeacon cannot set Authorization headers).
 */

const STORAGE_PREFIX = 'lp-watch-progress:';

export type BufferedProgress = {
  assignmentId: string;
  lastWatchedTimestamp: number;
  updatedAt: number;
};

export function progressStorageKey(assignmentId: string) {
  return `${STORAGE_PREFIX}${assignmentId}`;
}

export function readBufferedProgress(assignmentId: string): BufferedProgress | null {
  try {
    const raw = localStorage.getItem(progressStorageKey(assignmentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BufferedProgress;
    if (
      !parsed ||
      parsed.assignmentId !== assignmentId ||
      typeof parsed.lastWatchedTimestamp !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeBufferedProgress(
  assignmentId: string,
  lastWatchedTimestamp: number,
) {
  const payload: BufferedProgress = {
    assignmentId,
    lastWatchedTimestamp: Math.max(0, Math.floor(lastWatchedTimestamp)),
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(progressStorageKey(assignmentId), JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore; memory buffer still works in the page.
  }
  return payload;
}

export function clearBufferedProgress(assignmentId: string) {
  try {
    localStorage.removeItem(progressStorageKey(assignmentId));
  } catch {
    // ignore
  }
}

/** Fire-and-forget flush when the tab may be closing (cookies via credentials). */
export function beaconSaveProgress(
  assignmentId: string,
  lastWatchedTimestamp: number,
) {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
    /\/$/,
    '',
  );
  const url = `${base}/assignments/me/${assignmentId}/progress`;
  const body = JSON.stringify({
    lastWatchedTimestamp: Math.max(0, Math.floor(lastWatchedTimestamp)),
  });

  try {
    void fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    });
  } catch {
    // Best-effort on unload.
  }
}
