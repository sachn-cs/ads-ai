import { describe, it, expect } from 'vitest';
import {
  IdeaVariantSchema,
  IdeaExpansionResultSchema,
} from '@/src/models/idea';
import { StyleGuideSchema } from '@/src/models/style';
import { RenderDirectiveSchema } from '@/src/models/directives';
import { MarketingAssetSchema } from '@/src/models/marketing';

describe('new agent output schemas', () => {
  it('IdeaVariant validates', () => {
    const v = IdeaVariantSchema.parse({
      id: 'v1',
      index: 0,
      rationale: 'A teacher in a small coastal town receives a letter that changes everything about her routine.',
      brief: {
        logline: 'A teacher receives a letter that changes her morning routine.',
        synopsis: 'A teacher in a small coastal town receives a letter from a student she thought she had lost to time. The letter arrives in the final moment of a routine morning.',
        genre: 'narrative_short',
        tone: ['intimate'],
        targetRuntimeSeconds: 60,
        creativeNorthStars: ['Earned emotion over spectacle', 'Cinematographic composition'],
        visualApproach: 'Cool dawn palette with warm interior accent.',
        mustHaves: [],
        avoidances: [],
      },
      confidence: 0.8,
    });
    expect(v.index).toBe(0);
  });

  it('IdeaExpansionResult requires exactly 3 variants', () => {
    expect(() =>
      IdeaExpansionResultSchema.parse({
        variants: [{ id: 'a', index: 0, rationale: 'r', brief: { logline: 'l', synopsis: 's', genre: 'narrative_short', tone: ['t'], targetRuntimeSeconds: 60, creativeNorthStars: ['c'], visualApproach: 'v', mustHaves: [], avoidances: [] }, confidence: 0.5 }],
        modelUsed: 'MiniMax-M3',
        generatedAt: new Date().toISOString(),
      }),
    ).toThrow();
  });

  it('StyleGuide validates hex colors', () => {
    const sg = StyleGuideSchema.parse({
      id: 'sg-1',
      title: 'Noir',
      cinematicReferences: ['Aftersun'],
      palette: { primaryHues: ['#000000', '#ffffff', '#888888'], mood: 'somber' },
      lighting: { keyDirection: 'east', colorTemperature: 'cool', contrastMood: 'high', shadows: 'deep' },
      lensing: { preferredFocalLengthMm: [24, 35], apertureBias: 'shallow', movementStyle: 'slow push-in' },
      grainAndTexture: { grainLevel: 'subtle', stockReference: 'Kodak', lensCharacter: 'modern' },
      referenceImageHints: [],
      globalConstraints: [],
    });
    expect(sg.palette.primaryHues).toHaveLength(3);
    expect(() => {
      const failing = {
        id: 'sg-2', title: 't', cinematicReferences: [],
        palette: { primaryHues: ['not-a-hex'], mood: 'm' },
        lighting: { keyDirection: 'k', colorTemperature: 'cool' as const, contrastMood: 'low' as const, shadows: 's' },
        lensing: { preferredFocalLengthMm: [35], apertureBias: 'deep' as const, movementStyle: 's' },
        grainAndTexture: { grainLevel: 'none' as const, stockReference: 'x', lensCharacter: 'y' },
        referenceImageHints: [], globalConstraints: [],
      };
      StyleGuideSchema.parse(failing);
    }).toThrow();
  });

  it('RenderDirective validates patches', () => {
    const r = RenderDirectiveSchema.parse({
      id: 'rd-1',
      shotPatches: [
        {
          shotId: 'S01-001',
          originalPrompt: 'teacher walks',
          revisedPrompt: 'teacher walks slowly',
          reason: 'match pacing',
          lockedFields: ['provider'],
        },
      ],
      crossShotNotes: [],
      appliesToCycle: 1,
      generatedAt: new Date().toISOString(),
    });
    expect(r.shotPatches[0]?.lockedFields).toContain('provider');
  });

  it('MarketingAsset validates cutdowns and thumbnails', () => {
    const m = MarketingAssetSchema.parse({
      id: 'm-1',
      cutdowns: [
        { artifactId: 'c1', platform: 'youtube', durationSeconds: 60, aspectRatio: '16:9', hookSeconds: 3, structureOutline: ['hook', 'build', 'payoff'], captions: ['Watch this'], cta: 'Like & subscribe' },
      ],
      thumbnails: [
        { artifactId: 't1', platform: 'youtube', prompt: 'A teacher at a dock', headlineOverlay: 'The Letter', paletteHints: ['#000000'] },
      ],
      pressBlurb: 'A teacher receives a letter that changes everything.',
      hashtags: ['#cinestudio', '#film'],
      generatedAt: new Date().toISOString(),
    });
    expect(m.cutdowns).toHaveLength(1);
    expect(m.thumbnails).toHaveLength(1);
  });
});
