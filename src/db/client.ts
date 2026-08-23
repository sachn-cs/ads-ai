import Database from 'better-sqlite3';
import path from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { SCHEMA_DDL } from './schema';
import { resolveRoots } from '@/src/lib/artifacts';

let dbInstance: Database.Database | undefined;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const roots = resolveRoots();
  if (!existsSync(roots.dataDir)) mkdirSync(roots.dataDir, { recursive: true });
  const dbPath = path.join(roots.dataDir, 'cinestudio.db');
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('synchronous = NORMAL');
  applySchema(dbInstance);
  return dbInstance;
}

export function resetDbForTesting(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = undefined;
  }
}

function applySchema(db: Database.Database): void {
  db.exec('BEGIN');
  try {
    for (const stmt of SCHEMA_DDL) db.exec(stmt);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
