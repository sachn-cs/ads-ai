import { getDb } from './client';
import { DEFAULT_CONFIG, type CinestudioConfig } from '@/src/types';

const CONFIG_KEY = 'default';

export function loadConfig(): CinestudioConfig {
  const row = getDb()
    .prepare('SELECT config_json FROM configs WHERE id = ?')
    .get(CONFIG_KEY) as { config_json: string } | undefined;
  if (!row) return { ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
  try {
    return JSON.parse(row.config_json) as CinestudioConfig;
  } catch {
    return { ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
  }
}

export function saveConfig(config: CinestudioConfig): CinestudioConfig {
  const next = { ...config, updatedAt: new Date().toISOString() };
  getDb()
    .prepare(
      `INSERT INTO configs (id, config_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET config_json = excluded.config_json, updated_at = excluded.updated_at`,
    )
    .run(CONFIG_KEY, JSON.stringify(next), next.updatedAt);
  return next;
}

export function resetConfig(): CinestudioConfig {
  return saveConfig({ ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() });
}
