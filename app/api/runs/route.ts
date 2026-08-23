import { NextResponse, type NextRequest } from 'next/server';
import { startRun } from '@/src/orchestrator/run';
import { listRuns, getRun, updateRun } from '@/src/db/runs';
import { getSelectedIdeaVariant } from '@/src/db/idea-variants';
import { getDb } from '@/src/db/client';
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
    const body = (await request.json()) as {
      prompt?: string;
      runId?: string;
      brief?: CinestudioBriefShape;
    };

    // Path A: pick-a-variant flow. Body has runId + brief.
    // Resume the existing run with the selected brief; do NOT create a new run.
    if (body.runId && body.brief) {
      const db = getDb();
      const existing = getRun(body.runId);
      if (!existing) {
        return NextResponse.json({ error: 'run not found' }, { status: 404 });
      }
      updateRun(body.runId, {
        status: 'queued',
        brief_json: JSON.stringify(body.brief),
        title: (body.brief.logline ?? 'film').slice(0, 80),
      });
      const result = startExistingRun(body.runId);
      return NextResponse.json(result, { status: 202 });
    }

    // Path B: idea-picker flow. Body has runId only (selected variant
    // is already chosen via /api/ideas/select). Re-read the selected
    // brief from idea_variants.
    if (body.runId) {
      const db = getDb();
      const existing = getRun(body.runId);
      if (!existing) return NextResponse.json({ error: 'run not found' }, { status: 404 });
      const selected = getSelectedIdeaVariant(db, body.runId);
      if (!selected) {
        return NextResponse.json({ error: 'no selected idea variant for this run' }, { status: 400 });
      }
      const variant = JSON.parse(selected.variant_json);
      updateRun(body.runId, {
        status: 'queued',
        brief_json: selected.variant_json,
        title: variant.brief?.logline?.slice(0, 80),
      });
      const result = startExistingRun(body.runId);
      return NextResponse.json(result, { status: 202 });
    }

    // Path C: legacy flow. Create a brand-new run from a prompt.
    if (!body.prompt || body.prompt.trim().length < 5) {
      return NextResponse.json({ error: 'prompt or runId+brief required' }, { status: 400 });
    }
    const result = startRun({ prompt: body.prompt });
    log.info('run_started_legacy', { promptLength: body.prompt.length });
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    log.error('run_start_failed', { err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

// Lazy import to avoid circular dependency with orchestrator/run.
function startExistingRun(runId: string): { runId: string; status: 'queued' } {
  // The orchestrator reads the run's brief_json from the DB and
  // restarts the pipeline with the persisted context. Reuse startRun's
  // path: it creates a new run if runId is unset, and resumes from
  // the existing row when runId is provided (see run.ts).
  return startRun({ runIdForResume: runId } as never);
}

interface CinestudioBriefShape {
  id?: string;
  logline?: string;
}

