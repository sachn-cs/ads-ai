// Vitest setup — runs before every test file.
import { beforeEach } from 'vitest';
import { resetDbForTesting } from '@/src/db/client';

beforeEach(() => {
  resetDbForTesting();
});
