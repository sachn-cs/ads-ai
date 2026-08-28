import { describe, it, expect, beforeEach } from 'vitest';
import { encryptSecret, decryptSecret, isEncrypted } from '@/src/lib/secrets';

describe('secrets', () => {
  beforeEach(() => {
    process.env.CINESTUDIO_SECRET = 'test-secret-32bytes-or-more-please';
  });

  it('round-trips a secret', () => {
    const plain = 'sk-minimax-fake-key-12345';
    const enc = encryptSecret(plain);
    expect(isEncrypted(enc)).toBe(true);
    expect(enc).not.toContain(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it('handles empty input', () => {
    expect(encryptSecret('')).toBe('');
    expect(decryptSecret('')).toBe('');
  });

  it('passes through non-encrypted payloads on decrypt', () => {
    expect(decryptSecret('plain-text')).toBe('plain-text');
  });

  it('produces different ciphertext each time (random IV)', () => {
    const a = encryptSecret('hello');
    const b = encryptSecret('hello');
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe('hello');
    expect(decryptSecret(b)).toBe('hello');
  });

  it('detects encrypted format', () => {
    expect(isEncrypted(encryptSecret('x'))).toBe(true);
    expect(isEncrypted('plain')).toBe(false);
    expect(isEncrypted(undefined)).toBe(false);
    expect(isEncrypted(null)).toBe(false);
  });
});
