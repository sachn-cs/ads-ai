import { getDb } from './client';
import { randomUUID } from 'node:crypto';

export type AssetKind =
  | 'character_ref'
  | 'wardrobe_ref'
  | 'location_ref'
  | 'prop'
  | 'moodboard'
  | 'visual_test'
  | 'image'
  | 'video_ref';

export interface Asset {
  id: string;
  productionId: string;
  kind: AssetKind;
  title: string;
  storagePath: string;
  contentType: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  metadata: Record<string, unknown>;
  tags: string[];
  createdAt: string;
}

export interface AssetCreateInput {
  productionId: string;
  kind: AssetKind;
  title: string;
  storagePath: string;
  contentType?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

interface AssetRow {
  id: string;
  production_id: string;
  kind: string;
  title: string;
  storage_path: string;
  content_type: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  metadata_json: string;
  created_at: string;
}

function rowToAsset(r: AssetRow, tags: string[]): Asset {
  return {
    id: r.id,
    productionId: r.production_id,
    kind: r.kind as AssetKind,
    title: r.title,
    storagePath: r.storage_path,
    contentType: r.content_type,
    durationSeconds: r.duration_seconds,
    width: r.width,
    height: r.height,
    sizeBytes: r.size_bytes,
    metadata: safeParseJson(r.metadata_json),
    tags,
    createdAt: r.created_at,
  };
}

function safeParseJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function listAssets(
  productionId: string,
  filter: { kind?: AssetKind; tag?: string; collectionId?: string } = {},
): Asset[] {
  const db = getDb();
  const clauses = ['a.production_id = ?'];
  const params: (string | number)[] = [productionId];
  if (filter.kind) {
    clauses.push('a.kind = ?');
    params.push(filter.kind);
  }
  if (filter.tag) {
    clauses.push('EXISTS (SELECT 1 FROM asset_tags t WHERE t.asset_id = a.id AND t.tag = ?)');
    params.push(filter.tag);
  }
  if (filter.collectionId) {
    clauses.push(
      'EXISTS (SELECT 1 FROM asset_collection_items ci WHERE ci.asset_id = a.id AND ci.collection_id = ?)',
    );
    params.push(filter.collectionId);
  }
  const rows = db
    .prepare(
      `SELECT a.* FROM assets a WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`,
    )
    .all(...params) as AssetRow[];
  return rows.map((r) => rowToAsset(r, listTagsForAsset(r.id)));
}

export function getAsset(id: string): Asset | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM assets WHERE id = ?`).get(id) as AssetRow | undefined;
  return row ? rowToAsset(row, listTagsForAsset(id)) : null;
}

export function createAsset(input: AssetCreateInput): Asset {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO assets
     (id, production_id, kind, title, storage_path, content_type, duration_seconds,
      width, height, size_bytes, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.productionId,
    input.kind,
    input.title,
    input.storagePath,
    input.contentType ?? null,
    input.durationSeconds ?? null,
    input.width ?? null,
    input.height ?? null,
    input.sizeBytes ?? null,
    JSON.stringify(input.metadata ?? {}),
    now,
  );
  if (input.tags?.length) setTagsForAsset(id, input.tags);
  return getAsset(id)!;
}

export function deleteAsset(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM assets WHERE id = ?`).run(id);
}

function listTagsForAsset(assetId: string): string[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT tag FROM asset_tags WHERE asset_id = ? ORDER BY tag`)
    .all(assetId) as { tag: string }[];
  return rows.map((r) => r.tag);
}

function setTagsForAsset(assetId: string, tags: string[]): void {
  const db = getDb();
  db.prepare(`DELETE FROM asset_tags WHERE asset_id = ?`).run(assetId);
  const insert = db.prepare(`INSERT INTO asset_tags (asset_id, tag) VALUES (?, ?)`);
  db.exec('BEGIN');
  try {
    for (const t of tags) insert.run(assetId, t);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/* ===== collections ===== */

export interface AssetCollection {
  id: string;
  productionId: string;
  name: string;
  kind: string | null;
  createdAt: string;
}

export function listCollections(productionId: string): AssetCollection[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM asset_collections WHERE production_id = ? ORDER BY created_at DESC`,
    )
    .all(productionId) as {
    id: string;
    production_id: string;
    name: string;
    kind: string | null;
    created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    productionId: r.production_id,
    name: r.name,
    kind: r.kind,
    createdAt: r.created_at,
  }));
}

export function createCollection(
  productionId: string,
  name: string,
  kind: string | null = null,
): AssetCollection {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO asset_collections (id, production_id, name, kind, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, productionId, name, kind, now);
  return { id, productionId, name, kind, createdAt: now };
}
