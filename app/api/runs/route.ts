import { NextResponse, type NextRequest } from 'next/server';
import { startRun } from '@/src/orchestrator/run';
import { listRuns, getRun, updateRun } from '@/src/db/runs';
import { getSelectedIdeaVariant } from '@/src/db/idea-variants';
import { CreateRunRequestSchema } from '@/src/lib/validation';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/runs');

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
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
    const parsed = CreateRunRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid request', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const body = parsed.data;

    if (body.runId) {
      const existing = getRun(body.runId);
      if (!existing) {
        return NextResponse.json({ error: 'run not found' }, { status: 404 });
      }
      if (body.brief !== undefined) {
        const brief = body.brief as { logline?: unknown };
        const logline = typeof brief.logline === 'string' ? brief.logline.slice(0, 80) : null;
        updateRun(body.runId, {
          status: 'queued',
          brief_json: JSON.stringify(body.brief),
          title: logline,
        });
      } else {
        const { getDb } = await import('@/src/db/client');
        const selected = getSelectedIdeaVariant(getDb(), body.runId);
        if (!selected) {
          return NextResponse.json(
            { error: 'no selected idea variant for this run' },
            { status: 400 },
          );
        }
        const variant = JSON.parse(selected.variant_json) as { brief?: { logline?: string } };
        updateRun(body.runId, {
          status: 'queued',
          brief_json: selected.variant_json,
          title: variant.brief?.logline?.slice(0, 80),
        });
      }
      const result = startRun({ runIdForResume: body.runId, productionId: body.productionId ?? existing.production_id ?? '' });
      return NextResponse.json(result, { status: 202 });
    }

    if (!body.prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }
    const result = startRun({ prompt: body.prompt, productionId: body.productionId ?? '' });
    log.info('run_started_legacy', { promptLength: body.prompt.length });
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    log.error('run_start_failed', { err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
