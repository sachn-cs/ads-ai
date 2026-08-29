import { getDb } from './client';

export interface Comment {
  id: number;
  productionId: string;
  entityType: string;
  entityId: string;
  author: string;
  body: string;
  resolved: boolean;
  createdAt: string;
}

export interface CommentCreateInput {
  productionId: string;
  entityType: string;
  entityId: string;
  author: string;
  body: string;
}

interface CommentRow {
  id: number;
  production_id: string;
  entity_type: string;
  entity_id: string;
  author: string;
  body: string;
  resolved: number;
  created_at: string;
}

function rowToComment(r: CommentRow): Comment {
  return {
    id: r.id,
    productionId: r.production_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    author: r.author,
    body: r.body,
    resolved: r.resolved === 1,
    createdAt: r.created_at,
  };
}

export function listComments(
  productionId: string,
  filter: { entityType?: string; entityId?: string } = {},
): Comment[] {
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
      `SELECT * FROM comments WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`,
    )
    .all(...params) as CommentRow[];
  return rows.map(rowToComment);
}

export function createComment(input: CommentCreateInput): Comment {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO comments (production_id, entity_type, entity_id, author, body, resolved, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
    )
    .run(
      input.productionId,
      input.entityType,
      input.entityId,
      input.author,
      input.body,
      now,
    );
  return getComment(Number(info.lastInsertRowid))!;
}

export function getComment(id: number): Comment | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM comments WHERE id = ?`).get(id) as CommentRow | undefined;
  return row ? rowToComment(row) : null;
}

export function resolveComment(id: number): void {
  const db = getDb();
  db.prepare(`UPDATE comments SET resolved = 1 WHERE id = ?`).run(id);
}
