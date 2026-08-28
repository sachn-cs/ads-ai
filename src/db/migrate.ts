import { resetDbForTesting, getDb } from './client';
import { SCHEMA_DDL, MIGRATIONS } from './schema';
import { logger } from '@/src/lib/logger';

const isReset = process.argv.includes('--reset');
const isMigrate = !isReset;

const log = logger('db/migrate');

if (isReset) {
  resetDbForTesting();
  log.info('migrate_reset');
}

const db = getDb();
log.info(isMigrate ? 'migrate_applying_schema' : 'migrate_reapplying_schema');

for (const stmt of SCHEMA_DDL) {
  db.prepare(stmt).run();
}
log.info('migrate_schema_ok');

const applied = new Set(
  (db.prepare('SELECT name FROM migrations').all() as { name: string }[]).map((r) => r.name),
);
const queued = MIGRATIONS.filter((m) => !applied.has(m.name));
if (queued.length === 0) {
  log.info('migrate_no_pending');
} else {
  log.info('migrate_running_migrations', { count: queued.length, names: queued.map((m) => m.name) });
}
log.info('migrate_done');
process.exit(0);
