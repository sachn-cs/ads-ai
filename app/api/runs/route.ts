import { NextResponse, type NextRequest } from 'next/server';
import { startRun } from '@/src/orchestrator/run';
import { listRuns } from '@/src/db/runs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const rows = listRuns(50, 0);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string };
    if (!body.prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }
    const result = startRun({ prompt: body.prompt });
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
