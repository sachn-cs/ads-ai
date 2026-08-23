import { describe, it, expect } from 'vitest';
import { pAll } from '@/src/lib/promise';
import { ulid, shortId } from '@/src/lib/id';
import { safeJsonStringify, safeJsonParse } from '@/src/lib/json';

describe('pAll', () => {
  it('runs workers with bounded concurrency', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = await pAll(items, async (n) => n * 2, 3);
    expect(result).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
  });

  it('handles empty input', async () => {
    const result = await pAll<number, number>([], async (n) => n, 4);
    expect(result).toEqual([]);
  });
});

describe('id', () => {
  it('ulid produces 26 char base32 ids', () => {
    const id = ulid();
    expect(id).toHaveLength(26);
  });
  it('shortId produces 8 lowercase chars', () => {
    const s = shortId();
    expect(s).toHaveLength(8);
    expect(s).toBe(s.toLowerCase());
  });
});

describe('json', () => {
  it('safeJsonStringify handles bigints', () => {
    expect(() => safeJsonStringify({ n: 1n })).not.toThrow();
    const out = safeJsonStringify({ n: 1n });
    expect(out).toContain('"1"');
  });
  it('safeJsonParse falls back on invalid input', () => {
    expect(safeJsonParse('not json', 'fallback')).toBe('fallback');
  });
});
