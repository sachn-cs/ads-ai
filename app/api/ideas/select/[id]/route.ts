import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/src/db/client';
import { listIdeaVariants, markIdeaVariantSelected } from '@/src/db/idea-variants';
import { updateRun } from '@/src/db/runs';
import { SelectVariantRequestSchema } from '@/src/lib/validation';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/ideas/select');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
    const parsed = SelectVariantRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid request', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const body = parsed.data;
    const db = getDb();
    const existing = listIdeaVariants(db, runId);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'no idea variants exist for this run' }, { status: 404 });
    }
    if (!existing.find((v) => v.variant_index === body.variantIndex)) {
      return NextResponse.json({ error: 'variantIndex out of range' }, { status: 400 });
    }
    markIdeaVariantSelected(db, runId, body.variantIndex);
    const selected = existing.find((v) => v.variant_index === body.variantIndex);
    if (!selected) {
      return NextResponse.json({ error: 'variant not found' }, { status: 404 });
    }
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
