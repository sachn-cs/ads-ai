import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { listMultimodalAssets } from '@/src/db/multimodal-assets';
import { updateStatus } from '@/src/db/events';
import { emit } from '@/src/stream/sinks';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/runs/multimodal');

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  try {
    const assets = listMultimodalAssets(getDb(), runId);
    return NextResponse.json({
      runId,
      assets: assets.map((a) => ({
        id: a.id,
        kind: a.kind,
        artifact_id: a.artifact_id,
        storage_path: a.storage_path,
        content_type: a.content_type,
        size_bytes: a.size_bytes,
        created_at: a.created_at,
      })),
    });
  } catch (err) {
    log.error('multimodal_list_failed', { runId, err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  updateStatus(runId, 'cancelled');
  emit({ runId, type: 'run_failed', payload: { reason: 'user cancelled' } });
  log.info('run_cancelled', { runId });
  return NextResponse.json({ runId, status: 'cancelled' });
}
