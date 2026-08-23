import { NextResponse } from 'next/server';
import { updateStatus } from '@/src/db/events';
import { emit } from '@/src/stream/sinks';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/runs/cancel');

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  updateStatus(runId, 'cancelled');
  emit({ runId, type: 'run_failed', payload: { reason: 'user cancelled' } });
  log.info('run_cancelled', { runId });
  return NextResponse.json({ runId, status: 'cancelled' });
}
