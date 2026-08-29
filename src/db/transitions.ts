import { getDb } from './client';

export type TransitionType =
  | 'cut'
  | 'dissolve'
  | 'fade'
  | 'wipe'
  | 'match'
  | 'jump'
  | 'L-cut'
  | 'J-cut';

export interface Transition {
  id: number;
  productionId: string;
  fromShotId: string | null;
  toShotId: string | null;
  type: TransitionType;
  intent: string;
  continuityNotes: string | null;
  createdAt: string;
}

export interface TransitionCreateInput {
  productionId: string;
  fromShotId?: string | null;
  toShotId?: string | null;
  type: TransitionType;
  intent?: string;
  continuityNotes?: string;
}

interface TransitionRow {
  id: number;
  production_id: string;
  from_shot_id: string | null;
  to_shot_id: string | null;
  type: string;
  intent: string;
  continuity_notes: string | null;
  created_at: string;
}

function rowToTransition(r: TransitionRow): Transition {
  return {
    id: r.id,
    productionId: r.production_id,
    fromShotId: r.from_shot_id,
    toShotId: r.to_shot_id,
    type: r.type as TransitionType,
    intent: r.intent,
    continuityNotes: r.continuity_notes,
    createdAt: r.created_at,
  };
}

export function listTransitions(productionId: string): Transition[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM transitions WHERE production_id = ? ORDER BY id ASC`)
    .all(productionId) as TransitionRow[];
  return rows.map(rowToTransition);
}

export function createTransition(input: TransitionCreateInput): Transition {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO transitions
       (production_id, from_shot_id, to_shot_id, type, intent, continuity_notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.productionId,
      input.fromShotId ?? null,
      input.toShotId ?? null,
      input.type,
      input.intent ?? '',
      input.continuityNotes ?? null,
      now,
    );
  return getTransition(Number(info.lastInsertRowid))!;
}

export function getTransition(id: number): Transition | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM transitions WHERE id = ?`).get(id) as TransitionRow | undefined;
  return row ? rowToTransition(row) : null;
}

export function deleteTransition(id: number): void {
  const db = getDb();
  db.prepare(`DELETE FROM transitions WHERE id = ?`).run(id);
}
