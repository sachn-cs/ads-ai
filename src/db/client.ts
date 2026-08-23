import Database from 'better-sqlite3';
import path from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { SCHEMA_DDL, MIGRATIONS } from './schema';
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
  applyMigrations(dbInstance);
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

function applyMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT name FROM migrations').all() as { name: string }[]).map((r) => r.name),
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    if (migration.sql.checkApplied()) {
      db.prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)').run(migration.name, new Date().toISOString());
      continue;
    }
    const sql = migration.sql.apply();
    const execMany = (s: string) => db.exec(s);
    try {
      db.exec('BEGIN');
      execMany(sql);
      db.prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)').run(migration.name, new Date().toISOString());
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
