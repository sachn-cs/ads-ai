import { buildCinestudioGraph } from '@/src/graph/cinestudio';
import { loadConfig } from '@/src/db/configs';
import { createRun, updateRun } from '@/src/db/runs';
import { updateStatus } from '@/src/db/events';
import { emit } from '@/src/stream/sinks';
import { runDir, writeJson } from '@/src/lib/artifacts';
import path from 'node:path';
import { safeJsonStringify } from '@/src/lib/json';
import { logger } from '@/src/lib/logger';

const log = logger('orchestrator/run');

export interface StartRunInput {
  prompt: string;
}

export interface StartRunResult {
  runId: string;
  status: 'queued';
}

const inflight = new Map<string, Promise<void>>();

export function startRun(input: StartRunInput): StartRunResult {
  if (!input.prompt || input.prompt.trim().length < 5) {
    throw new Error('Prompt must be at least 5 characters.');
  }
  const runId = createRun(input.prompt);
  const artifactDir = process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts';
  const cwd = process.cwd();
  const artifactRoot = runDir(path.join(cwd, artifactDir), runId);
  writeJson(path.join(artifactRoot, 'prompt.txt'), input.prompt);

  const promise = (async () => {
    const config = loadConfig();
    if (!config.textProvider.enabled) {
      emit({ runId, type: 'run_failed', payload: { err: 'Text provider not configured. Complete onboarding.' } });
      updateStatus(runId, 'failed');
      return;
    }
    emit({ runId, type: 'run_started', payload: { prompt: input.prompt.slice(0, 200), provider: config.textProvider.provider, model: config.textProvider.model, aspectRatio: config.defaults.aspectRatio } });
    updateStatus(runId, 'running');
    try {
      const graph = buildCinestudioGraph(config, input.prompt, runId);
      const result = await graph.invoke(input.prompt, {
        invocationState: {
          runId,
          config,
          userPrompt: input.prompt,
        },
      });
      writeJson(path.join(artifactRoot, 'graph-result.json'), JSON.parse(safeJsonStringify(result)));
      const summary = result.status === 'COMPLETED' ? 'completed' : 'failed';
      updateRun(runId, {
        status: summary === 'completed' ? 'completed' : 'failed',
        quality_score: 0,
        quality_decision: 'GO',
        completed_at: new Date().toISOString(),
      });
      emit({ runId, type: summary === 'completed' ? 'run_completed' : 'run_failed', payload: { durationMs: result.duration, status: result.status } });
    } catch (err) {
      log.error('pipeline_failed', { runId, err: String(err) });
      updateStatus(runId, 'failed');
      emit({ runId, type: 'run_failed', payload: { err: String(err) } });
    } finally {
      inflight.delete(runId);
    }
  })();

  inflight.set(runId, promise);
  return { runId, status: 'queued' };
}

export function isRunInflight(runId: string): boolean {
  return inflight.has(runId);
}

export async function awaitRun(runId: string): Promise<void> {
  await inflight.get(runId);
}
