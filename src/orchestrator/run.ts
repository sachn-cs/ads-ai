import { runCinestudioPipeline } from './run-graph';
import { loadConfig } from '@/src/db/configs';
import { createRun } from '@/src/db/runs';
import { ProviderNotConfiguredError } from '@/src/lib/errors';
import { logger } from '@/src/lib/logger';

const log = logger('orchestrator/run');

export interface StartRunInput {
  prompt: string;
}

export interface StartRunResult {
  runId: string;
  status: 'queued';
}

const inflight = new Map<string, Promise<unknown>>();

export function startRun(input: StartRunInput): StartRunResult {
  if (!input.prompt || input.prompt.trim().length < 5) {
    throw new Error('Prompt must be at least 5 characters.');
  }
  const runId = createRun(input.prompt);

  const promise = (async () => {
    const config = loadConfig();
    if (!config.textProvider.enabled) {
      throw new ProviderNotConfiguredError(config.textProvider.provider);
    }
    log.info('run_started', { runId, promptLength: input.prompt.length });
    const result = await runCinestudioPipeline({ runId, prompt: input.prompt, config });
    log.info('run_finished', { runId, status: result.status });
  })().catch((err) => {
    log.error('run_crashed', { runId, err: String(err) });
  });

  inflight.set(runId, promise);
  void promise.finally(() => inflight.delete(runId));
  return { runId, status: 'queued' };
}

export function isRunInflight(runId: string): boolean {
  return inflight.has(runId);
}

export async function awaitRun(runId: string): Promise<unknown> {
  const p = inflight.get(runId);
  if (!p) throw new Error(`Run ${runId} not found`);
  return p;
}
