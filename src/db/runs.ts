import { ulid } from '@/src/lib/id';
import { getDb } from './client';
import type { z } from 'zod';
import type { RunStatusEnum as RunStatusEnumType } from '@/src/models';
import type { RunSummary } from '@/src/models';

type RunStatus = z.infer<typeof RunStatusEnumType>;

export interface RunRow {
  id: string;
  status: RunStatus;
  prompt: string;
  title: string | null;
  brief_json: string | null;
  cycle_count: number;
  total_shots: number;
  total_runtime_seconds: number;
  quality_score: number | null;
  quality_decision: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  artifacts_json: string;
}

export function createRun(prompt: string): string {
  const id = ulid();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO runs (id, status, prompt, created_at, updated_at, artifacts_json) VALUES (?, ?, ?, ?, ?, '[]')`,
    )
    .run(id, 'queued', prompt, now, now);
  return id;
}

export function updateRun(
  id: string,
  patch: Partial<Omit<RunRow, 'id' | 'created_at'>>,
): void {
  const keys = Object.keys(patch).filter((k) => k !== 'id' && k !== 'created_at');
  if (keys.length === 0) return;
  const set = keys.map((k) => `${snakeCase(k)} = ?`).join(', ');
  const values = keys.map((k) => (patch as Record<string, unknown>)[k]);
  getDb()
    .prepare(`UPDATE runs SET ${set}, updated_at = ? WHERE id = ?`)
    .run(...values, new Date().toISOString(), id);
}

export function getRun(id: string): RunRow | undefined {
  return getDb().prepare('SELECT * FROM runs WHERE id = ?').get(id) as RunRow | undefined;
}

export function listRuns(limit = 50, offset = 0): RunRow[] {
  return getDb()
    .prepare('SELECT * FROM runs ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as RunRow[];
}

export function summarize(row: RunRow): RunSummary {
  return {
    id: row.id,
    status: row.status,
    prompt: row.prompt,
    totalShots: row.total_shots,
    totalRuntimeSeconds: row.total_runtime_seconds,
    qualityScore: row.quality_score ?? undefined,
    qualityDecision: (row.quality_decision as RunSummary['qualityDecision']) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    artifactPaths: safeParseArray(row.artifacts_json),
  };
}

export function appendArtifact(runId: string, kind: string, p: string, payload?: unknown): void {
  getDb()
    .prepare(
      `INSERT INTO run_artifacts (run_id, kind, path, payload_json, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(runId, kind, p, payload ? JSON.stringify(payload) : null, new Date().toISOString());
}

export function listArtifacts(runId: string): { kind: string; path: string; createdAt: string }[] {
  return getDb()
    .prepare(`SELECT kind, path, created_at AS createdAt FROM run_artifacts WHERE run_id = ?`)
    .all(runId) as { kind: string; path: string; createdAt: string }[];
}

function safeParseArray(s: string): string[] {
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function snakeCase(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}
