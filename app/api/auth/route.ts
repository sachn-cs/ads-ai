import { NextResponse, type NextRequest } from 'next/server';
import { checkToken, buildCookieHeader, buildLogoutCookieHeader, getToken, isAuthEnabled } from '@/src/lib/auth';
import { LoginRequestSchema } from '@/src/lib/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json({ ok: true, authEnabled: false });
    }
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = LoginRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid request' }, { status: 400 });
    }
    if (!checkToken(parsed.data.token)) {
      return NextResponse.json({ error: 'invalid token' }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.headers.append('set-cookie', buildCookieHeader(getToken() ?? ''));
    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.append('set-cookie', buildLogoutCookieHeader());
  return response;
}
