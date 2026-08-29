import { getDb } from './client';
import { randomUUID } from 'node:crypto';

export interface Production {
  id: string;
  title: string;
  logline: string;
  status: 'draft' | 'active' | 'archived';
  currentVersion: number;
  currentRunId: string | null;
  ownerMemberId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionCreateInput {
  title: string;
  logline?: string;
  status?: Production['status'];
  ownerMemberId?: string | null;
}

interface ProductionRow {
  id: string;
  title: string;
  logline: string;
  status: string;
  current_version: number;
  current_run_id: string | null;
  owner_member_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToProduction(r: ProductionRow): Production {
  return {
    id: r.id,
    title: r.title,
    logline: r.logline,
    status: r.status as Production['status'],
    currentVersion: r.current_version,
    currentRunId: r.current_run_id,
    ownerMemberId: r.owner_member_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listProductions(limit = 50, offset = 0): Production[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, title, logline, status, current_version, current_run_id, owner_member_id, created_at, updated_at
       FROM productions
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as ProductionRow[];
  return rows.map(rowToProduction);
}

export function getProduction(id: string): Production | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, title, logline, status, current_version, current_run_id, owner_member_id, created_at, updated_at
       FROM productions
       WHERE id = ?`,
    )
    .get(id) as ProductionRow | undefined;
  return row ? rowToProduction(row) : null;
}

export function createProduction(input: ProductionCreateInput): Production {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO productions (id, title, logline, status, current_version, owner_member_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
  ).run(
    id,
    input.title,
    input.logline ?? '',
    input.status ?? 'draft',
    input.ownerMemberId ?? null,
    now,
    now,
  );
  return getProduction(id)!;
}

export function updateProduction(
  id: string,
  patch: Partial<Pick<Production, 'title' | 'logline' | 'status' | 'currentRunId'>>,
): Production {
  const db = getDb();
  const existing = getProduction(id);
  if (!existing) throw new Error(`Production ${id} not found`);
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE productions
     SET title = COALESCE(?, title),
         logline = COALESCE(?, logline),
         status = COALESCE(?, status),
         current_run_id = COALESCE(?, current_run_id),
         updated_at = ?
     WHERE id = ?`,
  ).run(
    patch.title ?? null,
    patch.logline ?? null,
    patch.status ?? null,
    patch.currentRunId ?? null,
    now,
    id,
  );
  return getProduction(id)!;
}

export function archiveProduction(id: string): Production {
  return updateProduction(id, { status: 'archived' });
}

export function bumpCurrentRun(productionId: string, runId: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE productions SET current_run_id = ?, updated_at = ? WHERE id = ?`,
  ).run(runId, new Date().toISOString(), productionId);
}
