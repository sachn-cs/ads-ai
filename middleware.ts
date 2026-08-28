import { NextResponse, type NextRequest } from 'next/server';
import { edgeAuthEnabled, edgeCheckRequest, edgeIsPublicPath } from '@/src/lib/auth-edge';

export function middleware(request: NextRequest): NextResponse {
  if (!edgeAuthEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (edgeIsPublicPath(pathname)) return NextResponse.next();

  if (edgeCheckRequest(request)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set('cache-control', 'no-store');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
