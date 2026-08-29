import { getDb } from './client';
import { randomUUID } from 'node:crypto';
import { takeSnapshot } from './versions';

export interface Character {
  id: string;
  productionId: string;
  name: string;
  role: string;
  appearance: string;
  ageCues: string | null;
  posture: string | null;
  emotionalBaseline: string | null;
  relationshipState: string | null;
  screenTimeNotes: string | null;
  visualMarkers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCreateInput {
  productionId: string;
  name: string;
  role?: string;
  appearance?: string;
  ageCues?: string;
  posture?: string;
  emotionalBaseline?: string;
  relationshipState?: string;
  screenTimeNotes?: string;
  visualMarkers?: string[];
}

interface CharacterRow {
  id: string;
  production_id: string;
  name: string;
  role: string;
  appearance: string;
  age_cues: string | null;
  posture: string | null;
  emotional_baseline: string | null;
  relationship_state: string | null;
  screen_time_notes: string | null;
  visual_markers_json: string;
  created_at: string;
  updated_at: string;
}

function rowToCharacter(r: CharacterRow): Character {
  return {
    id: r.id,
    productionId: r.production_id,
    name: r.name,
    role: r.role,
    appearance: r.appearance,
    ageCues: r.age_cues,
    posture: r.posture,
    emotionalBaseline: r.emotional_baseline,
    relationshipState: r.relationship_state,
    screenTimeNotes: r.screen_time_notes,
    visualMarkers: safeParseJsonArray(r.visual_markers_json),
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

export function listCharacters(productionId: string): Character[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM characters WHERE production_id = ? ORDER BY role DESC, name ASC`,
    )
    .all(productionId) as CharacterRow[];
  return rows.map(rowToCharacter);
}

export function getCharacter(id: string): Character | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM characters WHERE id = ?`).get(id) as CharacterRow | undefined;
  return row ? rowToCharacter(row) : null;
}

export function createCharacter(input: CharacterCreateInput, createdBy?: string): Character {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO characters
     (id, production_id, name, role, appearance, age_cues, posture, emotional_baseline,
      relationship_state, screen_time_notes, visual_markers_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.productionId,
    input.name,
    input.role ?? 'supporting',
    input.appearance ?? '',
    input.ageCues ?? null,
    input.posture ?? null,
    input.emotionalBaseline ?? null,
    input.relationshipState ?? null,
    input.screenTimeNotes ?? null,
    JSON.stringify(input.visualMarkers ?? []),
    now,
    now,
  );
  const c = getCharacter(id)!;
  takeSnapshot('character', id, c, createdBy, undefined, input.productionId);
  return c;
}

export function updateCharacter(
  id: string,
  patch: Partial<CharacterCreateInput>,
  updatedBy?: string,
): Character {
  const db = getDb();
  const existing = getCharacter(id);
  if (!existing) throw new Error(`Character ${id} not found`);
  const merged: Character = {
    ...existing,
    ...patch,
    visualMarkers: patch.visualMarkers ?? existing.visualMarkers,
    appearance: patch.appearance ?? existing.appearance,
  };
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE characters SET
      name = ?, role = ?, appearance = ?, age_cues = ?, posture = ?,
      emotional_baseline = ?, relationship_state = ?, screen_time_notes = ?,
      visual_markers_json = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    merged.name,
    merged.role,
    merged.appearance,
    merged.ageCues,
    merged.posture,
    merged.emotionalBaseline,
    merged.relationshipState,
    merged.screenTimeNotes,
    JSON.stringify(merged.visualMarkers),
    now,
    id,
  );
  const updated = getCharacter(id)!;
  takeSnapshot('character', id, updated, updatedBy, undefined, existing.productionId);
  return updated;
}

export function deleteCharacter(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM characters WHERE id = ?`).run(id);
}
