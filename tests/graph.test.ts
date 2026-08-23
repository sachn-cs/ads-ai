import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCinestudioGraph } from '@/src/graph/cinestudio';
import { DEFAULT_CONFIG } from '@/src/types';
import { resetDbForTesting } from '@/src/db/client';

vi.mock('@/src/agents/showrunner', () => ({
  invokeShowrunner: vi.fn(async () => ({
    id: 'brief-1',
    logline: 'A teacher receives a letter.',
    synopsis: 'A teacher in a small town receives a letter from a student she thought she lost. She drives to the docks.',
    genre: 'narrative_short',
    tone: ['intimate'],
    targetRuntimeSeconds: 90,
    audience: { who: 'a', where: [], expectations: [] },
    creativeNorthStars: ['Earned emotion'],
    visualApproach: { primaryHues: ['#3b6e8f'], contrastLevel: 'medium', aspectRatio: '16:9' },
    referenceFilms: [],
    avoidances: [],
    mustHaves: [],
    distributionTargets: ['youtube'],
    producedAt: new Date().toISOString(),
  })),
}));

const FAKE_CONFIG = {
  ...DEFAULT_CONFIG,
  textProvider: { ...DEFAULT_CONFIG.textProvider, enabled: true },
  renderProviders: {
    veo: { ...DEFAULT_CONFIG.renderProviders.veo, enabled: false, model: 'veo-3.1' },
    sora: { ...DEFAULT_CONFIG.renderProviders.sora, enabled: false, model: 'sora-1.0' },
    runway: { ...DEFAULT_CONFIG.renderProviders.runway, enabled: false, model: 'gen3a_turbo' },
  },
} as const;

describe('buildCinestudioGraph', () => {
  beforeEach(() => resetDbForTesting());

  it('constructs and exposes invoke', () => {
    const graph = buildCinestudioGraph(FAKE_CONFIG as never, 'A teacher receives a letter.', 'test-run-id');
    expect(typeof graph.invoke).toBe('function');
  });
});
