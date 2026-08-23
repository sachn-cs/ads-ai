import {
  Node,
  type MultiAgentState,
  type NodeConfig,
  type NodeDefinition,
  type NodeResultUpdate,
  type MultiAgentStreamEvent,
} from '@strands-agents/sdk';
import type { AgentId } from '@/src/agents';
import { emit, emitAgentOutput } from '@/src/stream/sinks';
import { logger } from '@/src/lib/logger';
import type { AppState } from '@/src/workflow/app-state';

const log = logger('workflow/agent-node');

export interface AgentNodeOptions<T> {
  id: AgentId;
  description: string;
  runId: string;
  invoke: (state: MultiAgentState, app: AppState) => Promise<T>;
  persistKey: keyof AppState;
}

export class AgentNode<T> extends Node<T, T> {
  constructor(opts: AgentNodeOptions<T>) {
    const def: NodeDefinition<T, T> = {
      id: opts.id,
      async *handle(
        _args: string | unknown[],
        state: MultiAgentState,
      ): AsyncGenerator<MultiAgentStreamEvent, NodeResultUpdate, undefined> {
        const runId = (state.app.get('runId') as string) ?? opts.runId;
        emit({ runId, type: 'agent_started', agentId: opts.id });
        const started = Date.now();
        try {
          const app = state.app as unknown as AppState;
          const result = await opts.invoke(state, app);
          const elapsed = Date.now() - started;
          app[opts.persistKey as string] = result as unknown;
          emitAgentOutput(runId, opts.id, result, elapsed);
          return {
            content: [{ type: 'textBlock' as const, text: `${opts.id} completed in ${elapsed}ms` }],
            structuredOutput: result as unknown as Record<string, unknown>,
            metadata: { durationMs: elapsed, persistKey: opts.persistKey as string },
          };
        } catch (err) {
          log.error('agent_node_failed', { agent: opts.id, err: String(err) });
          emit({ runId, type: 'agent_failed', agentId: opts.id, payload: { err: String(err) } });
          throw err;
        }
      },
    };
    const cfg: NodeConfig = {
      id: def.id,
      description: opts.description,
      timeout: 10 * 60 * 1000,
    };
    super(def, cfg);
  }
}
