import { getDb } from './client';

export type KnowledgeKind =
  | 'story_bible'
  | 'character_bible'
  | 'wardrobe_bible'
  | 'world_bible'
  | 'reference'
  | 'note'
  | 'rule';

export interface KnowledgeEntry {
  id: number;
  productionId: string;
  kind: KnowledgeKind;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeCreateInput {
  productionId: string;
  kind: KnowledgeKind;
  title: string;
  body: string;
  tags?: string[];
}

interface KnowledgeRow {
  id: number;
  production_id: string;
  kind: string;
  title: string;
  body: string;
  tags_json: string;
  created_at: string;
  updated_at: string;
}

function rowToKnowledge(r: KnowledgeRow): KnowledgeEntry {
  return {
    id: r.id,
    productionId: r.production_id,
    kind: r.kind as KnowledgeKind,
    title: r.title,
    body: r.body,
    tags: safeParseJsonArray(r.tags_json),
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

export function listKnowledge(productionId: string, kind?: KnowledgeKind): KnowledgeEntry[] {
  const db = getDb();
  if (kind) {
    const rows = db
      .prepare(
        `SELECT * FROM knowledge WHERE production_id = ? AND kind = ? ORDER BY updated_at DESC`,
      )
      .all(productionId, kind) as KnowledgeRow[];
    return rows.map(rowToKnowledge);
  }
  const rows = db
    .prepare(`SELECT * FROM knowledge WHERE production_id = ? ORDER BY updated_at DESC`)
    .all(productionId) as KnowledgeRow[];
  return rows.map(rowToKnowledge);
}

export function createKnowledge(input: KnowledgeCreateInput): KnowledgeEntry {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO knowledge (production_id, kind, title, body, tags_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.productionId,
      input.kind,
      input.title,
      input.body,
      JSON.stringify(input.tags ?? []),
      now,
      now,
    );
  const id = Number(info.lastInsertRowid);
  db.prepare(
    `INSERT INTO knowledge_fts (rowid, title, body) VALUES (?, ?, ?)`,
  ).run(id, input.title, input.body);
  return getKnowledge(id)!;
}

export function getKnowledge(id: number): KnowledgeEntry | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM knowledge WHERE id = ?`).get(id) as KnowledgeRow | undefined;
  return row ? rowToKnowledge(row) : null;
}

export function updateKnowledge(
  id: number,
  patch: Partial<Pick<KnowledgeCreateInput, 'title' | 'body' | 'tags' | 'kind'>>,
): KnowledgeEntry {
  const db = getDb();
  const existing = getKnowledge(id);
  if (!existing) throw new Error(`Knowledge ${id} not found`);
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE knowledge SET
      title = ?, body = ?, tags_json = ?, kind = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    patch.title ?? existing.title,
    patch.body ?? existing.body,
    JSON.stringify(patch.tags ?? existing.tags),
    patch.kind ?? existing.kind,
    now,
    id,
  );
  db.prepare(`DELETE FROM knowledge_fts WHERE rowid = ?`).run(id);
  const updated = getKnowledge(id)!;
  db.prepare(
    `INSERT INTO knowledge_fts (rowid, title, body) VALUES (?, ?, ?)`,
  ).run(updated.id, updated.title, updated.body);
  return updated;
}

export function searchKnowledge(productionId: string, query: string, limit = 20): KnowledgeEntry[] {
  const db = getDb();
  const sanitized = query.replace(/[^\w\s-]/g, ' ').trim();
  if (!sanitized) return [];
  const rows = db
    .prepare(
      `SELECT k.* FROM knowledge_fts f
       JOIN knowledge k ON k.id = f.rowid
       WHERE k.production_id = ? AND knowledge_fts MATCH ?
       ORDER BY rank LIMIT ?`,
    )
    .all(productionId, `${sanitized}*`, limit) as KnowledgeRow[];
  return rows.map(rowToKnowledge);
}

export function deleteKnowledge(id: number): void {
  const db = getDb();
  db.prepare(`DELETE FROM knowledge_fts WHERE rowid = ?`).run(id);
  db.prepare(`DELETE FROM knowledge WHERE id = ?`).run(id);
}
