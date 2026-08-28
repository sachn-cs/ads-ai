import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    getDb().prepare('SELECT 1').get();
    return NextResponse.json({ ready: true, ts: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ready: false, error: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}
