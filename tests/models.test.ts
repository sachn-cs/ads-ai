import { describe, it, expect } from 'vitest';
import { CinestudioBriefSchema } from '@/src/models';

describe('CinestudioBriefSchema', () => {
  it('accepts a complete valid brief', () => {
    const result = CinestudioBriefSchema.safeParse({
      id: 'test-id',
      logline: 'A teacher in a small coastal town receives a letter.',
      synopsis: 'A short piece about a teacher who receives a letter from a student she thought she lost — letter arrives in the final moment of a routine morning.',
      genre: 'narrative_short',
      tone: ['intimate', 'romantic'],
      targetRuntimeSeconds: 120,
      audience: {
        who: 'Adults 25-50 who love quiet character studies',
        where: ['Festival short film circuit', 'Online indie film community'],
        expectations: ['Earned emotion', 'Cinematographic composition', 'No jump scares'],
      },
      creativeNorthStars: ['Interiority over spectacle', 'Earned emotion', 'Cinematographic composition'],
      visualApproach: {
        primaryHues: ['#3b6e8f', '#a37c5b', '#0a0e12'],
        contrastLevel: 'medium',
        aspectRatio: '16:9',
        grain: 'subtle',
      },
      referenceFilms: ['Aftersun', 'Nomadland'],
      avoidances: ['No voiceover narration', 'No on-screen text', 'No non-diegetic music'],
      mustHaves: ['The moment the letter is opened is a single continuous shot.'],
      distributionTargets: ['festival_short_film', 'youtube'],
      producedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a brief that is too short', () => {
    const result = CinestudioBriefSchema.safeParse({
      id: '1',
      logline: 'short',
      synopsis: 'tiny',
      genre: 'narrative_short',
      tone: ['intimate'],
      targetRuntimeSeconds: 30,
      audience: { who: 'a', where: [], expectations: [] },
      creativeNorthStars: ['a'],
      visualApproach: {
        primaryHues: ['#000000'],
        contrastLevel: 'low',
        aspectRatio: '16:9',
      },
      avoidances: [],
      mustHaves: [],
      distributionTargets: ['youtube'],
      producedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects unreasonable runtime targets', () => {
    const result = CinestudioBriefSchema.shape.targetRuntimeSeconds.safeParse(0);
    expect(result.success).toBe(false);
    const result2 = CinestudioBriefSchema.shape.targetRuntimeSeconds.safeParse(60 * 60);
    expect(result2.success).toBe(false);
  });
});
