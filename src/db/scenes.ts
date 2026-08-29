import { getDb } from './client';
import { randomUUID } from 'node:crypto';
import { takeSnapshot } from './versions';

export interface Scene {
  id: string;
  productionId: string;
  number: number;
  title: string;
  locationId: string | null;
  beatSummary: string;
  characterIds: string[];
  emotionalIntent: string | null;
  pacing: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface SceneCreateInput {
  productionId: string;
  number: number;
  title: string;
  locationId?: string | null;
  beatSummary?: string;
  characterIds?: string[];
  emotionalIntent?: string;
  pacing?: string;
  orderIndex?: number;
}

interface SceneRow {
  id: string;
  production_id: string;
  number: number;
  title: string;
  location_id: string | null;
  beat_summary: string;
  character_ids_json: string;
  emotional_intent: string | null;
  pacing: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

function rowToScene(r: SceneRow): Scene {
  return {
    id: r.id,
    productionId: r.production_id,
    number: r.number,
    title: r.title,
    locationId: r.location_id,
    beatSummary: r.beat_summary,
    characterIds: safeParseJsonArray(r.character_ids_json),
    emotionalIntent: r.emotional_intent,
    pacing: r.pacing,
    orderIndex: r.order_index,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function safeParseJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function listScenes(productionId: string): Scene[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM scenes WHERE production_id = ? ORDER BY order_index ASC, number ASC`)
    .all(productionId) as SceneRow[];
  return rows.map(rowToScene);
}

export function getScene(id: string): Scene | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM scenes WHERE id = ?`).get(id) as SceneRow | undefined;
  return row ? rowToScene(row) : null;
}

export function createScene(input: SceneCreateInput, createdBy?: string): Scene {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  const order = input.orderIndex ?? input.number;
  db.prepare(
    `INSERT INTO scenes
     (id, production_id, number, title, location_id, beat_summary, character_ids_json,
      emotional_intent, pacing, order_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.productionId,
    input.number,
    input.title,
    input.locationId ?? null,
    input.beatSummary ?? '',
    JSON.stringify(input.characterIds ?? []),
    input.emotionalIntent ?? null,
    input.pacing ?? null,
    order,
    now,
    now,
  );
  const s = getScene(id)!;
  takeSnapshot('scene', id, s, createdBy, undefined, input.productionId);
  return s;
}

export function updateScene(id: string, patch: Partial<SceneCreateInput>, updatedBy?: string): Scene {
  const db = getDb();
  const existing = getScene(id);
  if (!existing) throw new Error(`Scene ${id} not found`);
  const merged: Scene = {
    ...existing,
    ...patch,
    characterIds: patch.characterIds ?? existing.characterIds,
  };
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE scenes SET
      number = ?, title = ?, location_id = ?, beat_summary = ?,
      character_ids_json = ?, emotional_intent = ?, pacing = ?, order_index = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    merged.number,
    merged.title,
    merged.locationId,
    merged.beatSummary,
    JSON.stringify(merged.characterIds),
    merged.emotionalIntent,
    merged.pacing,
    merged.orderIndex,
    now,
    id,
  );
  const updated = getScene(id)!;
  takeSnapshot('scene', id, updated, updatedBy, undefined, existing.productionId);
  return updated;
}

export function reorderScenes(productionId: string, orderedIds: string[]): void {
  const db = getDb();
  const stmt = db.prepare(`UPDATE scenes SET order_index = ?, updated_at = ? WHERE id = ?`);
  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    orderedIds.forEach((id, idx) => stmt.run(idx, now, id));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  void productionId;
}

export function deleteScene(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM scenes WHERE id = ?`).run(id);
}
