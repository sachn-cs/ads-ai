import { NextResponse, type NextRequest } from 'next/server';
import { loadConfig, saveConfig, resetConfig } from '@/src/db/configs';
import type { CinestudioConfig } from '@/src/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const config = loadConfig();
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as CinestudioConfig;
    const saved = saveConfig(body);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const reset = resetConfig();
    return NextResponse.json(reset);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
