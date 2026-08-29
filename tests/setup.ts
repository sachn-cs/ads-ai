// Vitest setup — runs before every test file.
import { beforeEach, beforeAll } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { resetDbForTesting, getDb } from '@/src/db/client';
import { SCHEMA_DDL } from '@/src/db/schema';
import { MIGRATIONS } from '@/src/db/schema';

beforeAll(() => {
  process.env.CINESTUDIO_SECRET = 'test-secret-32bytes-or-more-please';
  const dbPath = path.resolve(process.cwd(), 'data/cinestudio.test.db');
  if (existsSync(dbPath)) rmSync(dbPath);
  process.env.CINESTUDIO_DATA_DIR = './data';
  process.env.CINESTUDIO_ARTIFACT_DIR = './artifacts-test';
  // Pre-create schema once so tests can read new tables
  const db = getDb();
  for (const stmt of SCHEMA_DDL) db.exec(stmt);
  void MIGRATIONS;
});

beforeEach(() => {
  resetDbForTesting();
});
