import {
  Node,
  type MultiAgentState,
  type NodeConfig,
  type NodeDefinition,
  type NodeResultUpdate,
  type MultiAgentStreamEvent,
  type MultiAgentInput,
} from '@strands-agents/sdk/multiagent';
import { TextBlock, type StateStore } from '@strands-agents/sdk';
import type {
  ShotRenderInstruction,
  ShotRenderResult,
  RenderBatchPlan,
} from '@/src/models';
import { invokeRenderDispatcher } from '@/src/agents/render-dispatcher';
import { pAll } from '@/src/lib/promise';
import type { TextProviderConfig, RenderProviderConfig } from '@/src/types';
import { emit, emitAgentOutput } from '@/src/stream/sinks';
import { logger } from '@/src/lib/logger';

const log = logger('workflow/render-dispatch-node');

const NODE_ID = 'render_dispatch';

function readTextProvider(app: StateStore): TextProviderConfig {
  const v = app.get('textProvider') as TextProviderConfig | undefined;
  if (!v) throw new Error('RenderDispatchNode requires textProvider in app state.');
  return v;
}

function readRenderProviders(app: StateStore): Record<'veo' | 'sora' | 'runway', RenderProviderConfig> {
  const v = app.get('renderProviders') as Record<'veo' | 'sora' | 'runway', RenderProviderConfig> | undefined;
  if (!v) throw new Error('RenderDispatchNode requires renderProviders in app state.');
  return v;
}

function readBatches(app: StateStore): RenderBatchPlan[] {
  const v = app.get('shotBatches') as RenderBatchPlan[] | undefined;
  if (!v) throw new Error('RenderDispatchNode requires shotBatches in app state. Run shot_planner first.');
  return v;
}

export class RenderDispatchNode extends Node {
  handle: (
    input: MultiAgentInput,
    state: MultiAgentState,
  ) => AsyncGenerator<MultiAgentStreamEvent, NodeResultUpdate, undefined>;

  constructor() {
    const config: NodeConfig = { description: 'Parallel render dispatcher' };
    super(NODE_ID, config);

    // eslint-disable-next-line require-yield
    this.handle = async function* (
      input: MultiAgentInput,
      state: MultiAgentState,
    ): AsyncGenerator<MultiAgentStreamEvent, NodeResultUpdate, undefined> {
      void input;
      try {
      const app = state.app;
      const runId = (app.get('runId') as string | undefined) ?? 'unknown-run';
      const textCfg = readTextProvider(app);
      const renderProviders = readRenderProviders(app);
      const batches = readBatches(app);
      const preserveShotIds = app.get('preserveShotIds') as string[] | undefined;

      const allInstructions: ShotRenderInstruction[] = batches.flatMap((b) => b.shots);
      emit({
        runId,
        type: 'render_started',
        agentId: NODE_ID,
        payload: { shotCount: allInstructions.length, batchCount: batches.length },
      });

      const maxConcurrent = Math.max(
        1,
        ...Object.values(renderProviders).map((p) => p.maxConcurrentShots || 2),
      );
      const orderIndex = preserveShotIds
        ? new Map(preserveShotIds.map((id, i) => [id, i] as const))
        : undefined;
      const instructionList = orderIndex
        ? [...allInstructions].sort(
            (a, b) => (orderIndex.get(a.shotId) ?? 9e9) - (orderIndex.get(b.shotId) ?? 9e9),
          )
        : allInstructions;

      log.info('render_dispatch_started', { total: instructionList.length, maxConcurrent });

      const started = Date.now();
      const completed = await pAll(instructionList, async (instruction, idx) => {
        const t0 = Date.now();
        try {
          emit({
            runId,
            type: 'render_started',
            agentId: 'render_dispatcher',
            payload: { shotId: instruction.shotId, provider: instruction.provider, index: idx },
          });
          const result = await invokeRenderDispatcher(textCfg, renderProviders, instruction, runId);
          const status: 'render_completed' | 'render_failed' = result.status === 'completed' ? 'render_completed' : 'render_failed';
          emit({
            runId,
            type: status,
            agentId: 'render_dispatcher',
            payload: { shotId: instruction.shotId, status: result.status, durationMs: Date.now() - t0 },
          });
          emitAgentOutput(runId, 'render_dispatcher', result, Date.now() - t0);
          return result;
        } catch (err) {
          const failed: ShotRenderResult = {
            shotId: instruction.shotId,
            provider: instruction.provider,
            status: 'failed',
            errorMessage: err instanceof Error ? err.message : String(err),
            attempts: 1,
            metadata: {},
          };
          emit({ runId, type: 'render_failed', agentId: 'render_dispatcher', payload: { shotId: instruction.shotId, error: failed.errorMessage } });
          return failed;
        }
      }, maxConcurrent);

      app.set('renderResults', completed as unknown as Record<string, unknown>);
      const ok = completed.filter((r) => r.status === 'completed').length;
      const failed = completed.length - ok;
      const elapsed = Date.now() - started;

      emit({
        runId,
        type: 'checkpoint_written',
        agentId: NODE_ID,
        payload: { total: completed.length, ok, failed, durationMs: elapsed },
      });

      return {
        content: [
          new TextBlock(
            `render_dispatch: ${ok}/${completed.length} completed in ${elapsed}ms (${failed} failed)`,
          ),
        ],
        structuredOutput: { ok, failed, durationMs: elapsed } as unknown as Record<string, unknown>,
      };
      } catch (err) {
        log.error('render_dispatch_failed', { err: String(err), stack: err instanceof Error ? err.stack : undefined });
        throw err;
      }
    };
  }
}

void ({} as NodeDefinition);
export const RENDER_DISPATCH_ID = NODE_ID;
