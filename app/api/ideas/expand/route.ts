import { NextResponse, type NextRequest } from 'next/server';
import { loadConfig } from '@/src/db/configs';
import { getDb } from '@/src/db/client';
import { invokeIdeaExpander } from '@/src/agents/idea-expander';
import { createRun, updateRun } from '@/src/db/runs';
import { insertIdeaVariant } from '@/src/db/idea-variants';
import { updateStatus } from '@/src/db/events';
import { emit } from '@/src/stream/sinks';
import { ProviderNotConfiguredError } from '@/src/lib/errors';
import { IdeasExpandRequestSchema } from '@/src/lib/validation';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/ideas/expand');

export async function POST(request: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
    const parsed = IdeasExpandRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid request', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const body = parsed.data;
    if (!body.prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }
    const config = loadConfig({ redact: false });
    if (!config.textProvider.enabled) {
      return NextResponse.json(
        { error: new ProviderNotConfiguredError(config.textProvider.provider).message },
        { status: 400 },
      );
    }

    const count = Math.min(Math.max(body.count ?? config.defaults.ideaExpansionCount, 1), 5);
    const runId = createRun(body.prompt);
    updateStatus(runId, 'awaiting_review');

    emit({
      runId,
      type: 'run_started',
      payload: { phase: 'idea-expansion', prompt: body.prompt.slice(0, 200), count },
    });

    const result = await invokeIdeaExpander(config.textProvider, body.prompt, count);

    for (let i = 0; i < result.variants.length; i += 1) {
      const v = result.variants[i];
      if (!v) continue;
      insertIdeaVariant(getDb(), runId, v.index, JSON.stringify(v));
    }

    updateRun(runId, { status: 'awaiting_review' });
    emit({
      runId,
      type: 'run_completed',
      payload: { phase: 'idea-expansion', variantCount: result.variants.length, model: result.modelUsed },
    });

    log.info('idea_expansion_complete', { runId, count: result.variants.length });
    return NextResponse.json({ runId, result });
  } catch (err) {
    log.error('idea_expansion_failed', { err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
