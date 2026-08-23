import { NextResponse, type NextRequest } from 'next/server';
import { loadConfig } from '@/src/db/configs';
import { getDb } from '@/src/db/client';
import { invokeIdeaExpander } from '@/src/agents/idea-expander';
import { createRun, updateRun } from '@/src/db/runs';
import { insertIdeaVariant } from '@/src/db/idea-variants';
import { updateStatus } from '@/src/db/events';
import { emit } from '@/src/stream/sinks';
import { ProviderNotConfiguredError } from '@/src/lib/errors';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/ideas/expand');

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string; count?: number };
    if (!body.prompt || body.prompt.trim().length < 5) {
      return NextResponse.json({ error: 'prompt must be at least 5 characters' }, { status: 400 });
    }
    const config = loadConfig();
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
