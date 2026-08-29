import { getDb } from './client';

export type ContinuityKind = 'wardrobe' | 'object' | 'spatial' | 'emotional' | 'temporal';
export type ContinuitySeverity = 'info' | 'warn' | 'error';

export interface ContinuityEntry {
  id: number;
  productionId: string;
  kind: ContinuityKind;
  severity: ContinuitySeverity;
  sceneId: string | null;
  shotId: string | null;
  characterId: string | null;
  message: string;
  resolved: boolean;
  createdAt: string;
}

export interface ContinuityCreateInput {
  productionId: string;
  kind: ContinuityKind;
  severity?: ContinuitySeverity;
  sceneId?: string;
  shotId?: string;
  characterId?: string;
  message: string;
}

interface ContinuityRow {
  id: number;
  production_id: string;
  kind: string;
  severity: string;
  scene_id: string | null;
  shot_id: string | null;
  character_id: string | null;
  message: string;
  resolved: number;
  created_at: string;
}

function rowToEntry(r: ContinuityRow): ContinuityEntry {
  return {
    id: r.id,
    productionId: r.production_id,
    kind: r.kind as ContinuityKind,
    severity: r.severity as ContinuitySeverity,
    sceneId: r.scene_id,
    shotId: r.shot_id,
    characterId: r.character_id,
    message: r.message,
    resolved: r.resolved === 1,
    createdAt: r.created_at,
  };
}

export interface ContinuityFilter {
  severity?: ContinuitySeverity;
  kind?: ContinuityKind;
  sceneId?: string;
  shotId?: string;
  characterId?: string;
  resolved?: boolean;
}

export function listContinuity(
  productionId: string,
  filter: ContinuityFilter = {},
  limit = 200,
): ContinuityEntry[] {
  const db = getDb();
  const clauses = ['production_id = ?'];
  const params: (string | number)[] = [productionId];
  if (filter.severity) {
    clauses.push('severity = ?');
    params.push(filter.severity);
  }
  if (filter.kind) {
    clauses.push('kind = ?');
    params.push(filter.kind);
  }
  if (filter.sceneId) {
    clauses.push('scene_id = ?');
    params.push(filter.sceneId);
  }
  if (filter.shotId) {
    clauses.push('shot_id = ?');
    params.push(filter.shotId);
  }
  if (filter.characterId) {
    clauses.push('character_id = ?');
    params.push(filter.characterId);
  }
  if (filter.resolved !== undefined) {
    clauses.push('resolved = ?');
    params.push(filter.resolved ? 1 : 0);
  }
  params.push(limit);
  const rows = db
    .prepare(
      `SELECT * FROM continuity_log WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC LIMIT ?`,
    )
    .all(...params) as ContinuityRow[];
  return rows.map(rowToEntry);
}

export function createContinuityEntry(input: ContinuityCreateInput): ContinuityEntry {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO continuity_log
       (production_id, kind, severity, scene_id, shot_id, character_id, message, resolved, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
    .run(
      input.productionId,
      input.kind,
      input.severity ?? 'info',
      input.sceneId ?? null,
      input.shotId ?? null,
      input.characterId ?? null,
      input.message,
      now,
    );
  return getContinuityEntry(Number(info.lastInsertRowid))!;
}

export function getContinuityEntry(id: number): ContinuityEntry | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM continuity_log WHERE id = ?`)
    .get(id) as ContinuityRow | undefined;
  return row ? rowToEntry(row) : null;
}

export function resolveContinuityEntry(id: number): void {
  const db = getDb();
  db.prepare(`UPDATE continuity_log SET resolved = 1 WHERE id = ?`).run(id);
}

export function unresolvedCount(productionId: string): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM continuity_log WHERE production_id = ? AND resolved = 0`,
    )
    .get(productionId) as { n: number };
  return row.n;
}
