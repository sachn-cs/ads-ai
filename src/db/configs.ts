import { getDb } from './client';
import { DEFAULT_CONFIG, type CinestudioConfig } from '@/src/types';
import {
  decryptSecret,
  encryptSecret,
  isEncrypted,
  isSecretConfigured,
} from '@/src/lib/secrets';

const CONFIG_KEY = 'default';

const SENSITIVE_KEYS = [
  'apiKey',
] as const;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function redactKeys(cfg: CinestudioConfig): CinestudioConfig {
  const out = deepClone(cfg);
  const holder = out as unknown as Record<string, unknown>;
  for (const key of SENSITIVE_KEYS) {
    for (const path of [
      ['textProvider'],
      ['renderProviders', 'veo'],
      ['renderProviders', 'sora'],
      ['renderProviders', 'runway'],
      ['renderProviders', 'minimax'],
      ['multimodal', 'image'],
      ['multimodal', 'speech'],
      ['multimodal', 'music'],
    ]) {
      let cursor: Record<string, unknown> | undefined = holder;
      for (let i = 0; i < path.length; i++) {
        const seg = path[i];
        if (!seg || !cursor || typeof cursor !== 'object') {
          cursor = undefined;
          break;
        }
        cursor = cursor[seg] as Record<string, unknown> | undefined;
      }
      if (cursor && typeof cursor[key] === 'string' && (cursor[key] as string).length > 0) {
        cursor[`${key}Set`] = true;
        cursor[key] = undefined;
      }
    }
  }
  return out;
}

function encryptKeys(cfg: CinestudioConfig): CinestudioConfig {
  if (!isSecretConfigured()) return cfg;
  const out = deepClone(cfg);
  const holder = out as unknown as Record<string, unknown>;
  for (const key of SENSITIVE_KEYS) {
    for (const path of [
      ['textProvider'],
      ['renderProviders', 'veo'],
      ['renderProviders', 'sora'],
      ['renderProviders', 'runway'],
      ['renderProviders', 'minimax'],
      ['multimodal', 'image'],
      ['multimodal', 'speech'],
      ['multimodal', 'music'],
    ]) {
      let cursor: Record<string, unknown> | undefined = holder;
      for (let i = 0; i < path.length; i++) {
        const seg = path[i];
        if (!seg || !cursor || typeof cursor !== 'object') {
          cursor = undefined;
          break;
        }
        cursor = cursor[seg] as Record<string, unknown> | undefined;
      }
      if (cursor && typeof cursor[key] === 'string' && (cursor[key] as string).length > 0) {
        const value = cursor[key] as string;
        if (!isEncrypted(value)) {
          cursor[key] = encryptSecret(value);
        }
      }
    }
  }
  return out;
}

function decryptKeys(cfg: CinestudioConfig): CinestudioConfig {
  if (!isSecretConfigured()) return cfg;
  const out = deepClone(cfg);
  const holder = out as unknown as Record<string, unknown>;
  for (const key of SENSITIVE_KEYS) {
    for (const path of [
      ['textProvider'],
      ['renderProviders', 'veo'],
      ['renderProviders', 'sora'],
      ['renderProviders', 'runway'],
      ['renderProviders', 'minimax'],
      ['multimodal', 'image'],
      ['multimodal', 'speech'],
      ['multimodal', 'music'],
    ]) {
      let cursor: Record<string, unknown> | undefined = holder;
      for (let i = 0; i < path.length; i++) {
        const seg = path[i];
        if (!seg || !cursor || typeof cursor !== 'object') {
          cursor = undefined;
          break;
        }
        cursor = cursor[seg] as Record<string, unknown> | undefined;
      }
      if (cursor && typeof cursor[key] === 'string' && isEncrypted(cursor[key] as string)) {
        try {
          cursor[key] = decryptSecret(cursor[key] as string);
        } catch {
          cursor[key] = '';
        }
      }
    }
  }
  return out;
}

export interface LoadOptions {
  redact?: boolean;
}

export function loadConfig(options: LoadOptions = {}): CinestudioConfig {
  const row = getDb()
    .prepare('SELECT config_json FROM configs WHERE id = ?')
    .get(CONFIG_KEY) as { config_json: string } | undefined;
  if (!row) {
    const fresh = { ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
    return options.redact ? redactKeys(fresh) : fresh;
  }
  let parsed: CinestudioConfig;
  try {
    parsed = JSON.parse(row.config_json) as CinestudioConfig;
  } catch {
    parsed = { ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
  }
  const decrypted = decryptKeys(parsed);
  return options.redact ? redactKeys(decrypted) : decrypted;
}

export function saveConfig(config: CinestudioConfig): CinestudioConfig {
  const encrypted = encryptKeys(config);
  const next = { ...encrypted, updatedAt: new Date().toISOString() };
  getDb()
    .prepare(
      `INSERT INTO configs (id, config_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET config_json = excluded.config_json, updated_at = excluded.updated_at`,
    )
    .run(CONFIG_KEY, JSON.stringify(next), next.updatedAt);
  return loadConfig({ redact: false });
}

export function resetConfig(): CinestudioConfig {
  return saveConfig({ ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() });
}

export function setSecretKey(key: string, value: string): void {
  const cfg = loadConfig({ redact: false }) as unknown as Record<string, unknown>;
  const segments = key.split('.');
  let cursor: Record<string, unknown> = cfg;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (!seg) continue;
    if (!cursor[seg] || typeof cursor[seg] !== 'object') cursor[seg] = {};
    cursor = cursor[seg] as Record<string, unknown>;
  }
  const last = segments[segments.length - 1];
  if (last) cursor[last] = value;
  saveConfig(cfg as unknown as CinestudioConfig);
}
