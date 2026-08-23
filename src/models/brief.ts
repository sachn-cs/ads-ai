import { z } from 'zod';
import { CinematographyPaletteSchema, GenreEnum, ToneEnum } from './common';

export const CinestudioBriefSchema = z.object({
  id: z.string().describe('Stable id for this brief (ULID).'),
  logline: z.string().min(20).max(500).describe('One-sentence story hook.'),
  synopsis: z.string().min(100).describe('A short paragraph expanding the logline.'),
  genre: GenreEnum,
  tone: z.array(ToneEnum).min(1).max(3),
  targetRuntimeSeconds: z
    .number()
    .int()
    .min(15)
    .max(20 * 60)
    .describe('Target finished length in seconds.'),
  audience: z
    .object({
      who: z.string().describe('Demographic + psychographic profile.'),
      where: z.array(z.string()).describe('Where they discover and watch the piece.'),
      expectations: z.array(z.string()).describe('What they want from this kind of work.'),
    })
    .describe('Who we are making this for.'),
  creativeNorthStars: z
    .array(z.string())
    .min(2)
    .max(7)
    .describe('Artistic principles the production must honor.'),
  visualApproach: CinematographyPaletteSchema,
  referenceFilms: z
    .array(z.string())
    .max(10)
    .optional()
    .describe('Films the creative direction references (cite-or-honor, never copy).'),
  avoidances: z.array(z.string()).describe('Things we explicitly will not do.'),
  mustHaves: z.array(z.string()).describe('Beat / moment / image the piece must contain.'),
  distributionTargets: z
    .array(
      z.enum([
        'festival_short_film',
        'festival_feature',
        'youtube',
        'vimeo',
        'tiktok',
        'instagram_reels',
        'broadcast',
        'brand_owned',
      ]),
    )
    .min(1),
  producedAt: z.string().describe('ISO-8601 timestamp the brief was generated.'),
});
export type CinestudioBrief = z.infer<typeof CinestudioBriefSchema>;
