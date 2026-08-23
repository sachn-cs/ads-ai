import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '@/src/types';
import { saveConfig, loadConfig, resetConfig } from '@/src/db/configs';
import { resetDbForTesting } from '@/src/db/client';

describe('CinestudioConfig persistence', () => {
  beforeEachSetup();

  it('round-trips a config write+read', () => {
    const updated = {
      ...DEFAULT_CONFIG,
      textProvider: {
        ...DEFAULT_CONFIG.textProvider,
        provider: 'openai' as const,
        model: 'gpt-5',
      },
    };
    const saved = saveConfig(updated);
    const loaded = loadConfig();
    expect(loaded.textProvider.provider).toBe('openai');
    expect(loaded.textProvider.model).toBe('gpt-5');
    expect(loaded.version).toBe(DEFAULT_CONFIG.version);
    void saved;
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
});

function beforeEachSetup() {
  resetDbForTesting();
}
