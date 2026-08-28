import path from 'node:path';

const ALLOWED = /[^a-zA-Z0-9._-]/g;
const MAX_LEN = 128;

export function sanitizePathSegment(input: string, fallback = 'asset'): string {
  if (typeof input !== 'string') return fallback;
  let cleaned = input.replace(ALLOWED, '_').slice(0, MAX_LEN);
  if (cleaned.length === 0) return fallback;
  if (cleaned === '.' || cleaned === '..') return fallback;
  if (cleaned.startsWith('.')) cleaned = `_${cleaned}`;
  return cleaned;
}

export function safeJoin(root: string, ...segments: string[]): string {
  const sanitized = segments.map((s) => sanitizePathSegment(s, 'seg'));
  const joined = path.join(root, ...sanitized);
  const normalizedRoot = path.resolve(root);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    throw new Error(`path traversal detected: ${segments.join('/')} escapes root`);
  }
  return resolved;
}
