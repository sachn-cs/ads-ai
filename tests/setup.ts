// Vitest setup — runs before every test file.
import { beforeEach, beforeAll } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { resetDbForTesting } from '@/src/db/client';

beforeAll(() => {
  process.env.CINESTUDIO_SECRET = 'test-secret-32bytes-or-more-please';
  const dbPath = path.resolve(process.cwd(), 'data/cinestudio.test.db');
  if (existsSync(dbPath)) rmSync(dbPath);
  process.env.CINESTUDIO_DATA_DIR = './data';
  process.env.CINESTUDIO_ARTIFACT_DIR = './artifacts-test';
});

beforeEach(() => {
  resetDbForTesting();
});
