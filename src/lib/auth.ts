import { timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'cinestudio_session';

export function isAuthEnabled(): boolean {
  return Boolean(getToken());
}

export function getToken(): string | undefined {
  const t = process.env.CINESTUDIO_AUTH_TOKEN;
  if (!t || t.length < 8) return undefined;
  return t;
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return timingSafeEqual(ba, bb);
}

export function checkToken(submitted: string): boolean {
  const configured = getToken();
  if (!configured) return false;
  return safeEqual(submitted, configured);
}

export function buildCookieHeader(value: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export function buildLogoutCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}