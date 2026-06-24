import type { SessionOptions } from 'iron-session';

export interface SessionData {
  admin?: boolean;
  userId?: string;
  userName?: string;
  /** Stored temporarily while an Immich import session is active */
  immich?: { serverUrl: string; apiKey: string };
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-32-chars-minimum',
  cookieName: 'memorial-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};
