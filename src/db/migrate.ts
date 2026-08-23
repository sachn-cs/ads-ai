import { resetDbForTesting, getDb } from './client';
import { SCHEMA_DDL } from './schema';

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
console.log('[migrate] done');
process.exit(0);
