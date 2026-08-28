import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;
const SALT = 'cinestudio-v1';

let cachedKey: Buffer | undefined;

function deriveKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.CINESTUDIO_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'CINESTUDIO_SECRET env var is required (>=16 chars) to encrypt API keys at rest. ' +
        'Generate one with: openssl rand -hex 32',
    );
  }
  cachedKey = scryptSync(secret, SALT, KEY_LEN);
  return cachedKey;
}

export function isSecretConfigured(): boolean {
  const s = process.env.CINESTUDIO_SECRET;
  return typeof s === 'string' && s.length >= 16;
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  const key = deriveKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptSecret(payload: string): string {
  if (!payload) return '';
  if (!payload.startsWith('v1:')) {
    return payload;
  }
  const parts = payload.split(':');
  if (parts.length !== 4) throw new Error('malformed encrypted secret');
  const iv = Buffer.from(parts[1] ?? '', 'base64');
  const tag = Buffer.from(parts[2] ?? '', 'base64');
  const enc = Buffer.from(parts[3] ?? '', 'base64');
  const key = deriveKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

export function isEncrypted(payload: string | undefined | null): boolean {
  return typeof payload === 'string' && payload.startsWith('v1:');
}
