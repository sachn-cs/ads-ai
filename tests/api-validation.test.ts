import { describe, it, expect } from 'vitest';
import {
  ProviderTestSchema,
  IdeasExpandRequestSchema,
  SelectVariantRequestSchema,
  CreateRunRequestSchema,
  CreateMultimodalAssetRequestSchema,
  CinestudioConfigSchema,
} from '@/src/lib/validation';

describe('ProviderTestSchema', () => {
  it('accepts a minimal provider test', () => {
    expect(ProviderTestSchema.safeParse({ provider: 'minimax', model: 'MiniMax-M3' }).success).toBe(true);
  });
  it('rejects unknown provider', () => {
    expect(ProviderTestSchema.safeParse({ provider: 'fake', model: 'x' }).success).toBe(false);
  });
  it('rejects empty model', () => {
    expect(ProviderTestSchema.safeParse({ provider: 'openai', model: '' }).success).toBe(false);
  });
});

describe('IdeasExpandRequestSchema', () => {
  it('accepts prompt only', () => {
    const r = IdeasExpandRequestSchema.safeParse({ prompt: 'A teacher on a quiet morning.' });
    expect(r.success).toBe(true);
  });
  it('rejects short prompt', () => {
    expect(IdeasExpandRequestSchema.safeParse({ prompt: 'hi' }).success).toBe(false);
  });
  it('rejects count out of range', () => {
    expect(IdeasExpandRequestSchema.safeParse({ prompt: 'a teacher in a quiet morning', count: 99 }).success).toBe(false);
  });
});

describe('SelectVariantRequestSchema', () => {
  it('accepts valid variant index', () => {
    expect(SelectVariantRequestSchema.safeParse({ variantIndex: 2 }).success).toBe(true);
  });
  it('rejects negative index', () => {
    expect(SelectVariantRequestSchema.safeParse({ variantIndex: -1 }).success).toBe(false);
  });
});

describe('CreateRunRequestSchema', () => {
  it('accepts prompt only', () => {
    expect(CreateRunRequestSchema.safeParse({ prompt: 'a quiet morning letter' }).success).toBe(true);
  });
  it('accepts runId only (resume flow)', () => {
    expect(CreateRunRequestSchema.safeParse({ runId: 'abc123' }).success).toBe(true);
  });
  it('rejects empty body', () => {
    expect(CreateRunRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('CreateMultimodalAssetRequestSchema', () => {
  it('accepts image kind', () => {
    expect(
      CreateMultimodalAssetRequestSchema.safeParse({
        kind: 'character_portrait',
        artifactId: 'char-1',
        prompt: 'A young woman',
      }).success,
    ).toBe(true);
  });
  it('rejects unknown kind', () => {
    expect(
      CreateMultimodalAssetRequestSchema.safeParse({
        kind: 'unknown',
        artifactId: 'x',
        prompt: 'y',
      }).success,
    ).toBe(false);
  });
});

describe('CinestudioConfigSchema', () => {
  const valid = {
    version: '0.1.0',
    textProvider: { enabled: true, provider: 'minimax', model: 'MiniMax-M3', temperature: 0.7, maxTokens: 8192 },
    renderProviders: {
      veo: { enabled: false, model: 'veo-3.1', maxConcurrentShots: 4 },
      sora: { enabled: false, model: 'sora-2', maxConcurrentShots: 4 },
      runway: { enabled: false, model: 'gen3a_turbo', maxConcurrentShots: 4 },
      minimax: { enabled: true, model: 'MiniMax-H3', maxConcurrentShots: 4 },
    },
    multimodal: {
      image: { enabled: true, provider: 'minimax', model: 'image-01' },
      speech: { enabled: true, provider: 'minimax', model: 'speech-2.8-hd' },
      music: { enabled: true, provider: 'minimax', model: 'music-3.0' },
    },
    defaults: {
      maxIterations: 3,
      qualityThreshold: 70,
      targetRuntimeSeconds: { min: 30, max: 120 },
      aspectRatio: '16:9',
      enableVideoRender: true,
      enableAudioScore: false,
      ideaExpansionCount: 3,
    },
  };
  it('accepts valid config', () => {
    expect(CinestudioConfigSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects unknown text provider', () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.textProvider.provider = 'fake';
    expect(CinestudioConfigSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects ideaExpansionCount > 5', () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.defaults.ideaExpansionCount = 10;
    expect(CinestudioConfigSchema.safeParse(bad).success).toBe(false);
  });
});
