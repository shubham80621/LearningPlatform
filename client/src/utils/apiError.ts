import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 413) {
      return 'File is too large for the current upload limit.';
    }
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message.length) return message.join(' ');
  }
  return fallback;
}
