import { timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'cinestudio_session';
const TOKEN_HEADER = 'authorization';

export function isAuthEnabled(): boolean {
  return Boolean(getToken());
}

export function getToken(): string | undefined {
  const t = process.env.CINESTUDIO_AUTH_TOKEN;
  if (!t || t.length < 8) return undefined;
  return t;
}

export function getCookieName(): string {
  return COOKIE_NAME;
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

export function isAuthorizedRequest(request: Request): boolean {
  const configured = getToken();
  if (!configured) return true;
  const cookieHeader = request.headers.get('cookie') ?? '';
  for (const part of cookieHeader.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === COOKIE_NAME && v && safeEqual(decodeURIComponent(v), configured)) {
      return true;
    }
  }
  const auth = request.headers.get(TOKEN_HEADER) ?? '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length);
    if (safeEqual(token, configured)) return true;
  }
  return false;
}

export function buildCookieHeader(value: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export function buildLogoutCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function authHeaderName(): string {
  return TOKEN_HEADER;
}
