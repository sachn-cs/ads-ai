import { resetDbForTesting, getDb } from './client';
import { SCHEMA_DDL, MIGRATIONS } from './schema';

const isReset = process.argv.includes('--reset');
const isMigrate = !isReset;

if (isReset) {
  resetDbForTesting();
  console.log('[migrate] reset');
}

const db = getDb();
console.log(isMigrate ? '[migrate] applying schema...' : '[migrate] re-applying schema after reset...');

for (const stmt of SCHEMA_DDL) {
  db.prepare(stmt).run();
}
console.log('[migrate] schema OK');

const applied = new Set(
  (db.prepare('SELECT name FROM migrations').all() as { name: string }[]).map((r) => r.name),
);
const queued = MIGRATIONS.filter((m) => !applied.has(m.name));
if (queued.length === 0) {
  console.log('[migrate] no pending migrations');
} else {
  console.log(`[migrate] running ${queued.length} migration(s): ${queued.map((m) => m.name).join(', ')}`);
}
console.log('[migrate] done');
process.exit(0);
