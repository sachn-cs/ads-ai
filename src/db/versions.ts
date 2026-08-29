import { getDb } from './client';

export interface VersionSnapshot {
  id: number;
  productionId: string;
  entityType: string;
  entityId: string;
  versionNumber: number;
  snapshot: unknown;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface VersionRow {
  id: number;
  production_id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  snapshot_json: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

function rowToVersion(r: VersionRow): VersionSnapshot {
  return {
    id: r.id,
    productionId: r.production_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    versionNumber: r.version_number,
    snapshot: safeParseJson(r.snapshot_json),
    note: r.note,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function safeParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function listVersions(
  productionId: string,
  filter: { entityType?: string; entityId?: string } = {},
): VersionSnapshot[] {
  const db = getDb();
  const clauses = ['production_id = ?'];
  const params: string[] = [productionId];
  if (filter.entityType) {
    clauses.push('entity_type = ?');
    params.push(filter.entityType);
  }
  if (filter.entityId) {
    clauses.push('entity_id = ?');
    params.push(filter.entityId);
  }
  const rows = db
    .prepare(
      `SELECT * FROM versions WHERE ${clauses.join(' AND ')} ORDER BY version_number DESC`,
    )
    .all(...params) as VersionRow[];
  return rows.map(rowToVersion);
}

export function getVersion(
  productionId: string,
  entityType: string,
  entityId: string,
  versionNumber: number,
): VersionSnapshot | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM versions WHERE production_id = ? AND entity_type = ? AND entity_id = ? AND version_number = ?`,
    )
    .get(productionId, entityType, entityId, versionNumber) as VersionRow | undefined;
  return row ? rowToVersion(row) : null;
}

export function takeSnapshot(
  entityType: string,
  entityId: string,
  snapshot: unknown,
  createdBy?: string,
  note?: string,
  productionIdOverride?: string,
): VersionSnapshot {
  const db = getDb();
  const probe = productionIdOverride
    ? undefined
    : (db
        .prepare(
          `SELECT production_id FROM versions WHERE entity_type = ? AND entity_id = ? ORDER BY version_number DESC LIMIT 1`,
        )
        .get(entityType, entityId) as { production_id: string } | undefined);
  const productionId = productionIdOverride ?? probe?.production_id ?? '';
  const last = db
    .prepare(
      `SELECT MAX(version_number) AS n FROM versions WHERE entity_type = ? AND entity_id = ?`,
    )
    .get(entityType, entityId) as { n: number | null };
  const versionNumber = (last.n ?? 0) + 1;
  const now = new Date().toISOString();
  if (!productionId) {
    throw new Error(
      `takeSnapshot: productionId is required for new ${entityType} ${entityId}. Pass it explicitly or create the entity through a CRUD module that knows it.`,
    );
  }
  const info = db
    .prepare(
      `INSERT INTO versions (production_id, entity_type, entity_id, version_number, snapshot_json, note, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      productionId,
      entityType,
      entityId,
      versionNumber,
      JSON.stringify(snapshot),
      note ?? null,
      createdBy ?? null,
      now,
    );
  return getVersionById(Number(info.lastInsertRowid))!;
}

export function getVersionById(id: number): VersionSnapshot | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM versions WHERE id = ?`).get(id) as VersionRow | undefined;
  return row ? rowToVersion(row) : null;
}
