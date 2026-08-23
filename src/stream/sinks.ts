import type { RunEvent } from '@/src/models';
import { ulid } from '@/src/lib/id';
import { logger } from '@/src/lib/logger';
import { runBus } from './bus';
import { newRunEvent, recordEvent, recordAgentOutput } from '@/src/db/events';
import type { AgentId } from '@/src/agents';

const log = logger('stream/sinks');

export interface EmitOptions {
  runId: string;
  type: RunEvent['type'];
  agentId?: string;
  payload?: Record<string, unknown>;
}

export function emit(opts: EmitOptions): void {
  const event: RunEvent = {
    id: ulid(),
    runId: opts.runId,
    ts: new Date().toISOString(),
    type: opts.type,
    agentId: opts.agentId,
    payload: opts.payload ?? {},
  };
  try {
    recordEvent(event);
  } catch (err) {
    log.error('persist_event_failed', { err: String(err), type: event.type });
  }
  try {
    runBus().publish(event);
  } catch (err) {
    log.error('broadcast_failed', { err: String(err), type: event.type });
  }
}

export function emitAgentOutput(
  runId: string,
  agentId: AgentId,
  output: unknown,
  durationMs?: number,
): void {
  try {
    recordAgentOutput(runId, agentId, output, durationMs);
  } catch (err) {
    log.error('persist_agent_output_failed', { err: String(err), agentId });
  }
  emit({
    runId,
    type: 'agent_completed',
    agentId,
    payload: { durationMs, outputSize: JSON.stringify(output ?? null).length },
  });
}

export { newRunEvent };
