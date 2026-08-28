import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_CONFIG } from '@/src/types';
import { saveConfig, loadConfig, resetConfig } from '@/src/db/configs';
import { getDb, resetDbForTesting } from '@/src/db/client';

describe('CinestudioConfig persistence', () => {
  beforeEach(() => {
    process.env.CINESTUDIO_SECRET = 'test-secret-32bytes-or-more-please';
    resetDbForTesting();
  });

  it('round-trips a config write+read', () => {
    const updated: typeof DEFAULT_CONFIG = {
      ...DEFAULT_CONFIG,
      textProvider: {
        ...DEFAULT_CONFIG.textProvider,
        provider: 'openai',
        model: 'gpt-5',
      },
    };
    saveConfig(updated);
    const loaded = loadConfig();
    expect(loaded.textProvider.provider).toBe('openai');
    expect(loaded.textProvider.model).toBe('gpt-5');
    expect(loaded.version).toBe(DEFAULT_CONFIG.version);
  });

  it('reset returns to defaults', () => {
    const updated = {
      ...DEFAULT_CONFIG,
      textProvider: { ...DEFAULT_CONFIG.textProvider, provider: 'anthropic' as const },
    };
    saveConfig(updated);
    const reset = resetConfig();
    expect(reset.textProvider.provider).toBe('bedrock');
    expect(reset.textProvider.model).toBe(DEFAULT_CONFIG.textProvider.model);
  });

  it('redacts apiKey on load with redact:true', () => {
    const updated = {
      ...DEFAULT_CONFIG,
      textProvider: { ...DEFAULT_CONFIG.textProvider, apiKey: 'sk-minimax-real-key' },
    };
    saveConfig(updated);
    const redacted = loadConfig({ redact: true });
    expect(redacted.textProvider.apiKey).toBeUndefined();
    expect((redacted.textProvider as unknown as { apiKeySet?: boolean }).apiKeySet).toBe(true);
  });

  it('decrypts apiKey on load with redact:false (default)', () => {
    const updated = {
      ...DEFAULT_CONFIG,
      textProvider: { ...DEFAULT_CONFIG.textProvider, apiKey: 'sk-minimax-real-key' },
    };
    saveConfig(updated);
    const loaded = loadConfig();
    expect(loaded.textProvider.apiKey).toBe('sk-minimax-real-key');
  });

  it('encrypts apiKey at rest when CINESTUDIO_SECRET is set', () => {
    const updated = {
      ...DEFAULT_CONFIG,
      textProvider: { ...DEFAULT_CONFIG.textProvider, apiKey: 'sk-minimax-real-key' },
    };
    saveConfig(updated);
    const row = getDb().prepare('SELECT config_json FROM configs WHERE id = ?').get('default') as { config_json: string };
    expect(row.config_json).not.toContain('sk-minimax-real-key');
    expect(row.config_json).toContain('v1:');
  });
});
