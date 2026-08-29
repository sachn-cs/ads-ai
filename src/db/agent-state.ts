import { getDb } from './client';

export type AgentRunState = 'pending' | 'running' | 'done' | 'failed' | 'blocked';

export interface AgentStateRow {
  id: number;
  run_id: string;
  production_id: string | null;
  agent_id: string;
  role: string;
  current_task: string;
  state: AgentRunState;
  inputs_json: string;
  outputs_json: string;
  dependencies_json: string;
  confidence: number;
  warnings_json: string;
  history_json: string;
  started_at: string;
  updated_at: string;
}

export interface AgentState {
  id: number;
  runId: string;
  productionId: string | null;
  agentId: string;
  role: string;
  currentTask: string;
  state: AgentRunState;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  dependencies: string[];
  confidence: number;
  warnings: string[];
  history: { ts: string; event: string; data?: unknown }[];
  startedAt: string;
  updatedAt: string;
}

function rowToState(r: AgentStateRow): AgentState {
  return {
    id: r.id,
    runId: r.run_id,
    productionId: r.production_id,
    agentId: r.agent_id,
    role: r.role,
    currentTask: r.current_task,
    state: r.state,
    inputs: safeParseJson(r.inputs_json),
    outputs: safeParseJson(r.outputs_json),
    dependencies: safeParseJsonArray(r.dependencies_json),
    confidence: r.confidence,
    warnings: safeParseJsonArray(r.warnings_json),
    history: parseHistory(r.history_json),
    startedAt: r.started_at,
    updatedAt: r.updated_at,
  };
}

function parseHistory(s: string): AgentState['history'] {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is { ts: string; event: string; data?: unknown } =>
        x && typeof x === 'object' && typeof (x as { ts?: unknown }).ts === 'string' && typeof (x as { event?: unknown }).event === 'string',
    );
  } catch {
    return [];
  }
}

function safeParseJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function safeParseJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function upsertAgentState(input: {
  runId: string;
  productionId?: string | null;
  agentId: string;
  role?: string;
  currentTask?: string;
  state?: AgentRunState;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  dependencies?: string[];
  confidence?: number;
  warnings?: string[];
}): AgentState {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db
    .prepare(`SELECT * FROM agent_state WHERE run_id = ? AND agent_id = ?`)
    .get(input.runId, input.agentId) as AgentStateRow | undefined;
  if (existing) {
    db.prepare(
      `UPDATE agent_state SET
        current_task = COALESCE(?, current_task),
        state = COALESCE(?, state),
        inputs_json = COALESCE(?, inputs_json),
        outputs_json = COALESCE(?, outputs_json),
        dependencies_json = COALESCE(?, dependencies_json),
        confidence = COALESCE(?, confidence),
        warnings_json = COALESCE(?, warnings_json),
        updated_at = ?
       WHERE id = ?`,
    ).run(
      input.currentTask ?? null,
      input.state ?? null,
      input.inputs ? JSON.stringify(input.inputs) : null,
      input.outputs ? JSON.stringify(input.outputs) : null,
      input.dependencies ? JSON.stringify(input.dependencies) : null,
      input.confidence ?? null,
      input.warnings ? JSON.stringify(input.warnings) : null,
      now,
      existing.id,
    );
    return getAgentStateByRunAndAgent(input.runId, input.agentId)!;
  }
  db.prepare(
    `INSERT INTO agent_state
     (run_id, production_id, agent_id, role, current_task, state,
      inputs_json, outputs_json, dependencies_json, confidence, warnings_json,
      history_json, started_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.runId,
    input.productionId ?? null,
    input.agentId,
    input.role ?? '',
    input.currentTask ?? '',
    input.state ?? 'pending',
    JSON.stringify(input.inputs ?? {}),
    JSON.stringify(input.outputs ?? {}),
    JSON.stringify(input.dependencies ?? []),
    input.confidence ?? 0,
    JSON.stringify(input.warnings ?? []),
    '[]',
    now,
    now,
  );
  return getAgentStateByRunAndAgent(input.runId, input.agentId)!;
}

export function appendAgentHistory(
  runId: string,
  agentId: string,
  event: string,
  data?: unknown,
): void {
  const db = getDb();
  const row = db
    .prepare(`SELECT history_json FROM agent_state WHERE run_id = ? AND agent_id = ?`)
    .get(runId, agentId) as { history_json: string } | undefined;
  const history = row ? safeParseJsonArray(row.history_json) : [];
  const ts = new Date().toISOString();
  const entry = JSON.stringify({ ts, event, data });
  const next = JSON.stringify([...history.map((h) => JSON.parse(h)), JSON.parse(entry)].slice(-100));
  if (row) {
    db.prepare(
      `UPDATE agent_state SET history_json = ?, updated_at = ? WHERE run_id = ? AND agent_id = ?`,
    ).run(next, ts, runId, agentId);
  }
}

export function appendAgentWarning(runId: string, agentId: string, warning: string): void {
  const db = getDb();
  const row = db
    .prepare(`SELECT warnings_json FROM agent_state WHERE run_id = ? AND agent_id = ?`)
    .get(runId, agentId) as { warnings_json: string } | undefined;
  const warnings = row ? safeParseJsonArray(row.warnings_json) : [];
  const next = JSON.stringify([...warnings, warning].slice(-50));
  if (row) {
    db.prepare(
      `UPDATE agent_state SET warnings_json = ?, updated_at = ? WHERE run_id = ? AND agent_id = ?`,
    ).run(next, new Date().toISOString(), runId, agentId);
  }
}

export function setAgentConfidence(runId: string, agentId: string, confidence: number): void {
  const db = getDb();
  db.prepare(
    `UPDATE agent_state SET confidence = ?, updated_at = ? WHERE run_id = ? AND agent_id = ?`,
  ).run(confidence, new Date().toISOString(), runId, agentId);
}

export function getAgentStateByRunAndAgent(
  runId: string,
  agentId: string,
): AgentState | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM agent_state WHERE run_id = ? AND agent_id = ?`)
    .get(runId, agentId) as AgentStateRow | undefined;
  return row ? rowToState(row) : null;
}

export function listAgentStatesForRun(runId: string): AgentState[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM agent_state WHERE run_id = ? ORDER BY updated_at ASC`)
    .all(runId) as AgentStateRow[];
  return rows.map(rowToState);
}
