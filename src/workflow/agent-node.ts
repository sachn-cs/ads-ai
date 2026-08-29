import {
  Node,
  type MultiAgentState,
  type NodeConfig,
  type NodeResultUpdate,
  type MultiAgentStreamEvent,
  type MultiAgentInput,
} from '@strands-agents/sdk/multiagent';
import { TextBlock, type StateStore } from '@strands-agents/sdk';
import { emit, emitAgentOutput } from '@/src/stream/sinks';
import { logger } from '@/src/lib/logger';
import {
  upsertAgentState,
  appendAgentHistory,
  type AgentRunState,
} from '@/src/db/agent-state';

const log = logger('workflow/agent-node');

export interface AgentNodeOptions<T> {
  id: string;
  description: string;
  runId: string;
  invoke: (state: MultiAgentState, app: StateStore) => Promise<T>;
  persistKey: string;
}

export class AgentNode<T> extends Node {
  handle: (
    input: MultiAgentInput,
    state: MultiAgentState,
  ) => AsyncGenerator<MultiAgentStreamEvent, NodeResultUpdate, undefined>;

  constructor(opts: AgentNodeOptions<T>) {
    const config: NodeConfig = { description: opts.description };
    super(opts.id, config);

    // eslint-disable-next-line require-yield
    this.handle = async function* (
      input: MultiAgentInput,
      state: MultiAgentState,
    ): AsyncGenerator<MultiAgentStreamEvent, NodeResultUpdate, undefined> {
      void input;
      const runId = (state.app.get('runId') as string | undefined) ?? opts.runId;
      const productionId = (state.app.get('productionId') as string | undefined) ?? null;
      const role = (state.app.get(`${opts.id}.role`) as string | undefined) ?? '';
      const dependencies = (state.app.get(`${opts.id}.dependencies`) as string[] | undefined) ?? [];
      const currentTask = (state.app.get(`${opts.id}.task`) as string | undefined) ?? opts.description;

      try {
        upsertAgentState({
          runId,
          productionId,
          agentId: opts.id,
          role,
          currentTask,
          state: 'running' as AgentRunState,
          dependencies,
        });
        appendAgentHistory(runId, opts.id, 'started', { task: currentTask });
      } catch (err) {
        log.warn('agent_state_init_failed', { agent: opts.id, err: String(err) });
      }

      emit({ runId, type: 'agent_started', agentId: opts.id });
      const started = Date.now();
      try {
        const result = await opts.invoke(state, state.app);
        const elapsed = Date.now() - started;
        state.app.set(opts.persistKey, result as unknown as Record<string, unknown>);
        emitAgentOutput(runId, opts.id, result, elapsed);
        try {
          const confidence = (result as { confidence?: number } | undefined)?.confidence ?? 0.5;
          upsertAgentState({
            runId,
            productionId,
            agentId: opts.id,
            role,
            currentTask,
            state: 'done' as AgentRunState,
            outputs: result as Record<string, unknown>,
            confidence,
          });
          appendAgentHistory(runId, opts.id, 'completed', { durationMs: elapsed, confidence });
        } catch (err) {
          log.warn('agent_state_persist_failed', { agent: opts.id, err: String(err) });
        }
        return {
          content: [new TextBlock(`${opts.id} completed in ${elapsed}ms`)],
          structuredOutput: result as unknown as Record<string, unknown>,
        };
      } catch (err) {
        try {
          upsertAgentState({
            runId,
            productionId,
            agentId: opts.id,
            state: 'failed' as AgentRunState,
          });
          appendAgentHistory(runId, opts.id, 'failed', { err: String(err) });
        } catch (persistErr) {
          log.warn('agent_state_failure_persist_failed', {
            agent: opts.id,
            err: String(persistErr),
          });
        }
        log.error('agent_node_failed', { agent: opts.id, err: String(err) });
        emit({ runId, type: 'agent_failed', agentId: opts.id, payload: { err: String(err) } });
        throw err;
      }
    };
  }
}
