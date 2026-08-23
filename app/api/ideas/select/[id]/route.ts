import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/src/db/client';
import { listIdeaVariants, markIdeaVariantSelected } from '@/src/db/idea-variants';
import { updateRun } from '@/src/db/runs';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/ideas/select');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  try {
    const body = (await request.json()) as { variantIndex?: number };
    if (typeof body.variantIndex !== 'number') {
      return NextResponse.json({ error: 'variantIndex required' }, { status: 400 });
    }
    const db = getDb();
    const existing = listIdeaVariants(db, runId);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'no idea variants exist for this run' }, { status: 404 });
    }
    if (!existing.find((v) => v.variant_index === body.variantIndex)) {
      return NextResponse.json({ error: 'variantIndex out of range' }, { status: 400 });
    }
    markIdeaVariantSelected(db, runId, body.variantIndex);
    const selected = existing.find((v) => v.variant_index === body.variantIndex)!;
    updateRun(runId, { status: 'queued' });
    log.info('variant_selected', { runId, variantIndex: body.variantIndex });
    return NextResponse.json({
      runId,
      selectedVariant: JSON.parse(selected.variant_json),
      selectedVariantIndex: body.variantIndex,
    });
  } catch (err) {
    log.error('variant_select_failed', { runId, err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
