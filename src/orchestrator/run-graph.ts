import { buildCinestudioGraph } from '@/src/graph/cinestudio';
import { runIterationLoop } from './iterate';
import { updateRun, appendArtifact } from '@/src/db/runs';
import { updateStatus } from '@/src/db/events';
import { emit } from '@/src/stream/sinks';
import { runDir, writeJson } from '@/src/lib/artifacts';
import { safeJsonStringify } from '@/src/lib/json';
import path from 'node:path';
import { logger } from '@/src/lib/logger';
import type { CinestudioConfig } from '@/src/types';

const log = logger('orchestrator/run-graph');

export interface RunGraphInput {
  runId: string;
  prompt: string;
  config: CinestudioConfig;
}

export async function runCinestudioPipeline(input: RunGraphInput): Promise<{
  status: 'completed' | 'failed';
  graphResult: unknown;
  iterationResult: unknown;
}> {
  const { runId, prompt, config } = input;
  const artifactRoot = runDir(/* turbopackIgnore */ path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'), runId);

  emit({ runId, type: 'run_started', payload: { phase: 'main-pipeline' } });
  updateStatus(runId, 'running');

  const graph = buildCinestudioGraph(config, prompt, runId);

  let graphResult;
  try {
    graphResult = await graph.invoke(prompt, {
      invocationState: { runId, config, userPrompt: prompt },
    });
  } catch (err) {
    log.error('main_pipeline_failed', { runId, err: String(err) });
    updateStatus(runId, 'failed');
    emit({ runId, type: 'run_failed', payload: { phase: 'main-pipeline', err: String(err) } });
    return { status: 'failed', graphResult: null, iterationResult: null };
  }

  writeJson(path.join(artifactRoot, 'graph-result.json'), JSON.parse(safeJsonStringify(graphResult)));
  appendArtifact(runId, 'graph-result', path.join(artifactRoot, 'graph-result.json'), graphResult);

  if (graphResult.status !== 'COMPLETED') {
    updateStatus(runId, 'failed');
    emit({ runId, type: 'run_failed', payload: { phase: 'main-pipeline', status: graphResult.status } });
    return { status: 'failed', graphResult, iterationResult: null };
  }

  emit({ runId, type: 'tool_called', payload: { tool: 'iteration_loop', maxCycles: config.defaults.maxIterations } });
  const iterationResult = await runIterationLoop({ runId, config });

  const result = { status: 'completed' as const, graphResult, iterationResult };
  updateRun(runId, {
    status: result.status,
    completed_at: new Date().toISOString(),
  });
  return result;
}
