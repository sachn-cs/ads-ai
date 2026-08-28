// Vitest setup — runs before every test file.
import { beforeEach } from 'vitest';
import { resetDbForTesting } from '@/src/db/client';

beforeEach(() => {
  process.env.CINESTUDIO_SECRET = 'test-secret-32bytes-or-more-please';
  resetDbForTesting();
});
