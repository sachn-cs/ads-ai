import {
  Node,
  type MultiAgentState,
  type NodeConfig,
  type NodeResultUpdate,
  type MultiAgentStreamEvent,
  type MultiAgentInput,
} from '@strands-agents/sdk/multiagent';
import { TextBlock } from '@strands-agents/sdk';
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
      emit({ runId, type: 'agent_started', agentId: opts.id });
      const started = Date.now();
      try {
        const app = state.app as unknown as AppState;
        const result = await opts.invoke(state, app);
        const elapsed = Date.now() - started;
        (app as Record<string, unknown>)[opts.persistKey as string] = result;
        emitAgentOutput(runId, opts.id, result, elapsed);
        return {
          content: [new TextBlock(`${opts.id} completed in ${elapsed}ms`)],
          structuredOutput: result as unknown as Record<string, unknown>,
        };
      } catch (err) {
        log.error('agent_node_failed', { agent: opts.id, err: String(err) });
        emit({ runId, type: 'agent_failed', agentId: opts.id, payload: { err: String(err) } });
        throw err;
      }
    };
  }
}
