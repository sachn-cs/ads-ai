import {
  Node,
  type MultiAgentState,
  type NodeConfig,
  type NodeDefinition,
  type NodeResultUpdate,
  type MultiAgentStreamEvent,
} from '@strands-agents/sdk';
import type {
  ShotRenderInstruction,
  ShotRenderResult,
} from '@/src/models';
import { invokeRenderDispatcher } from '@/src/agents/render-dispatcher';
import { pAll } from '@/src/lib/promise';
import type { TextProviderConfig, RenderProviderConfig } from '@/src/types';
import { emit, emitAgentOutput } from '@/src/stream/sinks';
import { logger } from '@/src/lib/logger';
import { readApp, type AppState } from './app-state';

const log = logger('workflow/render-dispatch-node');

const NODE_ID = 'render_dispatch';

export class RenderDispatchNode extends Node<unknown, ShotRenderResult[]> {
  constructor() {
    const def: NodeDefinition<unknown, ShotRenderResult[]> = {
      id: NODE_ID,
      async *handle(
        _args: string | unknown[],
        state: MultiAgentState,
      ): AsyncGenerator<MultiAgentStreamEvent, NodeResultUpdate, undefined> {
        const app = state.app as unknown as AppState;
        const runId = readApp<string>(app, 'runId');
        const textCfg = readApp<TextProviderConfig>(app, 'textProvider');
        const renderProviders = readApp<Record<'veo' | 'sora' | 'runway', RenderProviderConfig>>(app, 'renderProviders');
        const batches = readApp<RenderBatchPlan[]>(app, 'shotBatches');
        const preserveShotIds = readApp<string[] | undefined>(app, 'preserveShotIds') ?? undefined;

        const allInstructions: ShotRenderInstruction[] = batches.flatMap((b) => b.instructions);
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
        const instructionList = preserveShotIds
          ? [...allInstructions].sort((a, b) => {
              const idx = new Map(preserveShotIds.map((id, i) => [id, i] as const));
              return (idx.get(a.shotId) ?? 9e9) - (idx.get(b.shotId) ?? 9e9);
            })
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
            const result = await invokeRenderDispatcher(textCfg, renderProviders, instruction);
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

        app.renderResults = completed;
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
            {
              type: 'textBlock' as const,
              text: `render_dispatch: ${ok}/${completed.length} completed in ${elapsed}ms (${failed} failed)`,
            },
          ],
          structuredOutput: { ok, failed, durationMs: elapsed } as unknown as Record<string, unknown>,
          metadata: { total: completed.length, ok, failed },
        };
      },
    };
    const cfg: NodeConfig = { id: def.id, description: 'Parallel render dispatcher', timeout: 30 * 60 * 1000 };
    super(def, cfg);
  }
}

export const RENDER_DISPATCH_ID = NODE_ID;
