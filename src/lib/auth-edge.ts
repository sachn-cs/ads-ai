const COOKIE_NAME = 'cinestudio_session';
const TOKEN_HEADER = 'authorization';

export function getEdgeCookieName(): string {
  return COOKIE_NAME;
}
export function getEdgeTokenHeader(): string {
  return TOKEN_HEADER;
}

export function edgeAuthEnabled(): boolean {
  const t = process.env.CINESTUDIO_AUTH_TOKEN;
  return typeof t === 'string' && t.length >= 8;
}

export function edgeCheckRequest(request: Request): boolean {
  const t = process.env.CINESTUDIO_AUTH_TOKEN;
  if (!t || t.length < 8) return true;
  const cookieHeader = request.headers.get('cookie') ?? '';
  for (const part of cookieHeader.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === COOKIE_NAME && v && decodeURIComponent(v) === t) return true;
  }
  const auth = request.headers.get(TOKEN_HEADER) ?? '';
  if (auth.startsWith('Bearer ') && auth.slice('Bearer '.length) === t) return true;
  return false;
}

export function edgeIsPublicPath(pathname: string): boolean {
  const PUBLIC = new Set(['/login', '/api/auth', '/api/healthz', '/api/readyz']);
  if (PUBLIC.has(pathname)) return true;
  const PREFIXES = ['/_next', '/favicon', '/public'];
  return PREFIXES.some((p) => pathname.startsWith(p));
}
