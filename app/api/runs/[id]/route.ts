import { NextResponse } from 'next/server';
import { getRun } from '@/src/db/runs';
import { listAgentOutputs } from '@/src/db/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) return NextResponse.json({ error: 'run not found' }, { status: 404 });
  const outputs = listAgentOutputs(id);
  return NextResponse.json({ run, outputs });
}
