import { getDb } from './client';
import { randomUUID } from 'node:crypto';
import { takeSnapshot } from './versions';

export type ShotSize =
  | 'W'
  | 'MS'
  | 'MCU'
  | 'CU'
  | 'ECU'
  | 'OTS'
  | 'Insert'
  | 'Establishing'
  | 'Tracking';

export interface Shot {
  id: string;
  sceneId: string;
  productionId: string;
  number: number;
  framing: string;
  angle: string;
  lens: string;
  shotSize: ShotSize;
  movement: string;
  intent: string;
  visualEmphasis: string | null;
  subjectPlacement: string | null;
  backgroundDepth: string | null;
  environmentNotes: string | null;
  continuityNotes: string | null;
  emotionalIntent: string | null;
  transitionIn: string | null;
  transitionOut: string | null;
  durationSeconds: number;
  prompt: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShotCreateInput {
  sceneId: string;
  productionId: string;
  number: number;
  framing?: string;
  angle?: string;
  lens?: string;
  shotSize?: ShotSize;
  movement?: string;
  intent?: string;
  visualEmphasis?: string;
  subjectPlacement?: string;
  backgroundDepth?: string;
  environmentNotes?: string;
  continuityNotes?: string;
  emotionalIntent?: string;
  transitionIn?: string;
  transitionOut?: string;
  durationSeconds?: number;
  prompt?: string;
  orderIndex?: number;
}

interface ShotRow {
  id: string;
  scene_id: string;
  production_id: string;
  number: number;
  framing: string;
  angle: string;
  lens: string;
  shot_size: string;
  movement: string;
  intent: string;
  visual_emphasis: string | null;
  subject_placement: string | null;
  background_depth: string | null;
  environment_notes: string | null;
  continuity_notes: string | null;
  emotional_intent: string | null;
  transition_in: string | null;
  transition_out: string | null;
  duration_seconds: number;
  prompt: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

function rowToShot(r: ShotRow): Shot {
  return {
    id: r.id,
    sceneId: r.scene_id,
    productionId: r.production_id,
    number: r.number,
    framing: r.framing,
    angle: r.angle,
    lens: r.lens,
    shotSize: r.shot_size as ShotSize,
    movement: r.movement,
    intent: r.intent,
    visualEmphasis: r.visual_emphasis,
    subjectPlacement: r.subject_placement,
    backgroundDepth: r.background_depth,
    environmentNotes: r.environment_notes,
    continuityNotes: r.continuity_notes,
    emotionalIntent: r.emotional_intent,
    transitionIn: r.transition_in,
    transitionOut: r.transition_out,
    durationSeconds: r.duration_seconds,
    prompt: r.prompt,
    orderIndex: r.order_index,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listShots(productionId: string, sceneId?: string): Shot[] {
  const db = getDb();
  if (sceneId) {
    const rows = db
      .prepare(
        `SELECT * FROM shots WHERE production_id = ? AND scene_id = ? ORDER BY order_index ASC, number ASC`,
      )
      .all(productionId, sceneId) as ShotRow[];
    return rows.map(rowToShot);
  }
  const rows = db
    .prepare(`SELECT * FROM shots WHERE production_id = ? ORDER BY order_index ASC, number ASC`)
    .all(productionId) as ShotRow[];
  return rows.map(rowToShot);
}

export function getShot(id: string): Shot | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM shots WHERE id = ?`).get(id) as ShotRow | undefined;
  return row ? rowToShot(row) : null;
}

export function createShot(input: ShotCreateInput, createdBy?: string): Shot {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  const order = input.orderIndex ?? input.number;
  db.prepare(
    `INSERT INTO shots
     (id, scene_id, production_id, number, framing, angle, lens, shot_size, movement, intent,
      visual_emphasis, subject_placement, background_depth, environment_notes,
      continuity_notes, emotional_intent, transition_in, transition_out,
      duration_seconds, prompt, order_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.sceneId,
    input.productionId,
    input.number,
    input.framing ?? '',
    input.angle ?? '',
    input.lens ?? '',
    input.shotSize ?? 'MS',
    input.movement ?? '',
    input.intent ?? '',
    input.visualEmphasis ?? null,
    input.subjectPlacement ?? null,
    input.backgroundDepth ?? null,
    input.environmentNotes ?? null,
    input.continuityNotes ?? null,
    input.emotionalIntent ?? null,
    input.transitionIn ?? null,
    input.transitionOut ?? null,
    input.durationSeconds ?? 5,
    input.prompt ?? null,
    order,
    now,
    now,
  );
  const s = getShot(id)!;
  takeSnapshot('shot', id, s, createdBy, undefined, input.productionId);
  return s;
}

export function updateShot(id: string, patch: Partial<ShotCreateInput>, updatedBy?: string): Shot {
  const db = getDb();
  const existing = getShot(id);
  if (!existing) throw new Error(`Shot ${id} not found`);
  const merged: Shot = { ...existing, ...patch };
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE shots SET
      number = ?, framing = ?, angle = ?, lens = ?, shot_size = ?, movement = ?, intent = ?,
      visual_emphasis = ?, subject_placement = ?, background_depth = ?, environment_notes = ?,
      continuity_notes = ?, emotional_intent = ?, transition_in = ?, transition_out = ?,
      duration_seconds = ?, prompt = ?, order_index = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    merged.number,
    merged.framing,
    merged.angle,
    merged.lens,
    merged.shotSize,
    merged.movement,
    merged.intent,
    merged.visualEmphasis,
    merged.subjectPlacement,
    merged.backgroundDepth,
    merged.environmentNotes,
    merged.continuityNotes,
    merged.emotionalIntent,
    merged.transitionIn,
    merged.transitionOut,
    merged.durationSeconds,
    merged.prompt,
    merged.orderIndex,
    now,
    id,
  );
  const updated = getShot(id)!;
  takeSnapshot('shot', id, updated, updatedBy, undefined, existing.productionId);
  return updated;
}

export function reorderShots(sceneId: string, orderedIds: string[]): void {
  const db = getDb();
  const stmt = db.prepare(`UPDATE shots SET order_index = ?, updated_at = ? WHERE id = ?`);
  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    orderedIds.forEach((id, idx) => stmt.run(idx, now, id));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  void sceneId;
}

export function deleteShot(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM shots WHERE id = ?`).run(id);
}
