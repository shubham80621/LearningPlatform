import axios from 'axios';

function messageFromBody(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && message.length) return message.join(' ');
  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 413) {
      return 'File is too large for the current upload limit.';
    }
    if (error.response?.status === 429) {
      return (
        messageFromBody(error.response?.data) ??
        'Too many requests. Please wait a moment and try again.'
      );
    }
    return messageFromBody(error.response?.data) ?? fallback;
  }

  // RTK Query / fetchBaseQuery: { status, data }
  if (error && typeof error === 'object' && 'status' in error && 'data' in error) {
    const status = (error as { status?: unknown }).status;
    if (status === 413) return 'File is too large for the current upload limit.';
    if (status === 429) {
      return (
        messageFromBody((error as { data?: unknown }).data) ??
        'Too many requests. Please wait a moment and try again.'
      );
    }
    return messageFromBody((error as { data?: unknown }).data) ?? fallback;
  }

  return fallback;
}
