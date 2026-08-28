import { runCinestudioPipeline } from './run-graph';
import { loadConfig } from '@/src/db/configs';
import { createRun, getRun } from '@/src/db/runs';
import { ProviderNotConfiguredError, RunCancelledError } from '@/src/lib/errors';
import { logger, setCurrentRunId, clearCurrentRunId } from '@/src/lib/logger';

const log = logger('orchestrator/run');

export interface StartRunInput {
  prompt?: string;
  runIdForResume?: string;
}

export interface StartRunResult {
  runId: string;
  status: 'queued';
}

const inflight = new Map<string, Promise<unknown>>();
const abortControllers = new Map<string, AbortController>();

export function startRun(input: StartRunInput): StartRunResult {
  let runId: string;
  let prompt: string;

  if (input.runIdForResume) {
    const existing = getRun(input.runIdForResume);
    if (!existing) throw new Error(`Run ${input.runIdForResume} not found`);
    runId = existing.id;
    prompt = existing.prompt;
    log.info('run_resume', { runId, promptLength: prompt.length });
  } else {
    if (!input.prompt || input.prompt.trim().length < 5) {
      throw new Error('Prompt must be at least 5 characters.');
    }
    runId = createRun(input.prompt);
    prompt = input.prompt;
  }

  const controller = new AbortController();
  abortControllers.set(runId, controller);

  const promise = (async () => {
    setCurrentRunId(runId);
    try {
      const config = loadConfig();
      if (!config.textProvider.enabled) {
        throw new ProviderNotConfiguredError(config.textProvider.provider);
      }
      log.info('run_started', { runId, promptLength: prompt.length });
      const result = await runCinestudioPipeline({
        runId,
        prompt,
        config,
        abortSignal: controller.signal,
      });
      log.info('run_finished', { runId, status: result.status });
    } finally {
      clearCurrentRunId();
    }
  })().catch((err) => {
    if (controller.signal.aborted) {
      log.info('run_aborted', { runId });
      return;
    }
    log.error('run_crashed', { runId, err: String(err) });
  });

  inflight.set(runId, promise);
  void promise.finally(() => {
    inflight.delete(runId);
    abortControllers.delete(runId);
  });
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

export function cancelRun(runId: string): boolean {
  const ctrl = abortControllers.get(runId);
  if (!ctrl) return false;
  ctrl.abort(new RunCancelledError(runId));
  return true;
}
