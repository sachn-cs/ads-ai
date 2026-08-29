import { describe, it, expect } from 'vitest';
import { invokeRenderDispatcher } from '@/src/agents/render-dispatcher';
import type { TextProviderConfig, RenderProviderConfig } from '@/src/types';
import type { ShotRenderInstruction } from '@/src/models';

const TEXT_CFG: TextProviderConfig = {
  enabled: true,
  provider: 'minimax',
  model: 'MiniMax-M3',
  apiKey: 'k',
};

const PROVIDERS = {
  veo: { enabled: false, model: 'veo-3.1', maxConcurrentShots: 1 },
  sora: { enabled: false, model: 'sora-2', maxConcurrentShots: 1 },
  runway: { enabled: false, model: 'gen3a_turbo', maxConcurrentShots: 1 },
  minimax: { enabled: true, model: 'MiniMax-H3', apiKey: 'k', maxConcurrentShots: 1 },
} satisfies Record<'veo' | 'sora' | 'runway' | 'minimax', RenderProviderConfig>;

const baseInstruction: ShotRenderInstruction = {
  shotId: 's1',
  provider: 'minimax',
  model: 'MiniMax-H3',
  prompt: 'A quiet morning scene unfolds with delicate natural light and soft focus on a single character.',
  negativePrompt: '',
  aspectRatio: '16:9',
  cameraSpec: { move: 'static', lensMm: 50 },
  lightingSpec: { palette: ['#fff'], keyDirection: 'soft', atmosphere: 'calm', exposureMood: 'high_key' },
  durationSeconds: 5,
};

describe('RenderDispatcher minimax routing', () => {
  it('accepts provider=minimax', async () => {
    const result = await invokeRenderDispatcher(TEXT_CFG, PROVIDERS, baseInstruction, 'run-1');
    expect(['completed', 'failed', 'skipped']).toContain(result.status);
    expect(result.provider).toBe('minimax');
  });

  it('rejects unknown provider', async () => {
    const result = await invokeRenderDispatcher(TEXT_CFG, PROVIDERS, {
      ...baseInstruction,
      provider: 'unknown' as unknown as 'minimax',
    }, 'run-1');
    expect(['skipped', 'failed']).toContain(result.status);
  });

  it('skips when provider disabled', async () => {
    const result = await invokeRenderDispatcher(TEXT_CFG, {
      ...PROVIDERS,
      minimax: { ...PROVIDERS.minimax, enabled: false },
    }, baseInstruction, 'run-1');
    expect(result.status).toBe('skipped');
  });

  it('fails when api key missing', async () => {
    const result = await invokeRenderDispatcher(TEXT_CFG, {
      ...PROVIDERS,
      minimax: { ...PROVIDERS.minimax, apiKey: '' },
    }, baseInstruction, 'run-1');
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toMatch(/api key/i);
  });
});
