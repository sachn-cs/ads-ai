import { describe, it, expect } from 'vitest';
import { sanitizePathSegment, safeJoin } from '@/src/lib/path';
import path from 'node:path';

describe('sanitizePathSegment', () => {
  it('passes through safe strings', () => {
    expect(sanitizePathSegment('shot-01')).toBe('shot-01');
    expect(sanitizePathSegment('character_cast.001')).toBe('character_cast.001');
  });
  it('strips slashes and traversal', () => {
    expect(sanitizePathSegment('../../etc/passwd')).toBe('_.._.._etc_passwd');
    expect(sanitizePathSegment('a/b\\c')).toBe('a_b_c');
  });
  it('replaces control chars and quotes', () => {
    expect(sanitizePathSegment('foo;rm -rf /')).toBe('foo_rm_-rf__');
  });
  it('falls back on empty or only-dots', () => {
    expect(sanitizePathSegment('')).toBe('asset');
    expect(sanitizePathSegment('..')).toBe('asset');
    expect(sanitizePathSegment('.')).toBe('asset');
  });
  it('prefixes leading dot', () => {
    expect(sanitizePathSegment('.hidden')).toBe('_.hidden');
  });
  it('truncates to MAX_LEN', () => {
    const out = sanitizePathSegment('x'.repeat(500));
    expect(out.length).toBe(128);
  });
});

describe('safeJoin', () => {
  it('joins inside root', () => {
    const root = path.resolve('/tmp/cinestudio');
    const out = safeJoin(root, 'renders', 'shot-01.mp4');
    expect(out.startsWith(root + path.sep)).toBe(true);
    expect(out.endsWith('shot-01.mp4')).toBe(true);
  });
  it('neutralizes traversal segments via sanitization', () => {
    const root = path.resolve('/tmp/cinestudio');
    const out1 = safeJoin(root, '..', 'etc', 'passwd');
    expect(out1.startsWith(root + path.sep)).toBe(true);
    const out2 = safeJoin(root, 'renders', '../../etc/passwd');
    expect(out2.startsWith(root + path.sep)).toBe(true);
  });
});
