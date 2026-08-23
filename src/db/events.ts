import { getDb } from './client';
import { ulid } from '@/src/lib/id';
import type { AgentId } from '@/src/agents';
import type { RunEvent, RunStatusEnum } from '@/src/models';

export function recordAgentOutput(runId: string, agentId: AgentId, output: unknown, durationMs?: number): void {
  getDb()
    .prepare(
      `INSERT INTO agent_outputs (run_id, agent_id, output_json, duration_ms, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(runId, agentId, JSON.stringify(output), durationMs ?? null, new Date().toISOString());
}

export function recordEvent(event: RunEvent): void {
  getDb()
    .prepare(
      `INSERT INTO run_events (run_id, ts, type, agent_id, payload_json) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(event.runId, event.ts, event.type, event.agentId ?? null, JSON.stringify(event.payload));
}

export function listEvents(runId: string, since: number = 0): { id: number; ts: string; type: string; agentId: string | null; payload: Record<string, unknown> }[] {
  const rows = getDb()
    .prepare('SELECT id, ts, type, agent_id AS agentId, payload_json FROM run_events WHERE run_id = ? AND id > ? ORDER BY id')
    .all(runId, since) as { id: number; ts: string; type: string; agent_id: string | null; payload_json: string }[];
  return rows.map((r) => ({
    id: r.id,
    ts: r.ts,
    type: r.type,
    agentId: r.agent_id,
    payload: JSON.parse(r.payload_json),
  }));
}

export function listAgentOutputs(runId: string, agentId?: AgentId): { id: number; cycle: number; output: unknown; createdAt: string }[] {
  const params: unknown[] = [runId];
  let query = 'SELECT id, cycle, output_json, created_at AS createdAt FROM agent_outputs WHERE run_id = ?';
  if (agentId) {
    query += ' AND agent_id = ?';
    params.push(agentId);
  }
  query += ' ORDER BY id';
  const rows = getDb().prepare(query).all(...params) as { id: number; cycle: number; output_json: string; createdAt: string }[];
  return rows.map((r) => ({
    id: r.id,
    cycle: r.cycle,
    output: JSON.parse(r.output_json),
    createdAt: r.createdAt,
  }));
}

export function newRunEvent(runId: string, type: RunEvent['type'], agentId?: string, payload: Record<string, unknown> = {}): RunEvent {
  return {
    id: ulid(),
    runId,
    ts: new Date().toISOString(),
    type,
    agentId,
    payload,
  };
}

export function updateStatus(runId: string, status: RunStatusEnum): void {
  getDb()
    .prepare('UPDATE runs SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), runId);
}
