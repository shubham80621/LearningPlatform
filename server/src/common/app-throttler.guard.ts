import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Track by JWT (prefix) when present so shared NATs don't lump every user
 * into one bucket; otherwise use client IP (login / anonymous).
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const auth = req.headers?.authorization;
    if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice(7).trim();
      if (token.length > 0) {
        return `token:${token.slice(0, 24)}`;
      }
    }

    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return `ip:${forwarded.split(',')[0].trim()}`;
    }

    return `ip:${req.ip ?? req.socket?.remoteAddress ?? 'unknown'}`;
  }
}
