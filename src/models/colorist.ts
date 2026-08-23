import { z } from 'zod';

export const LUTSpecSchema = z.object({
  name: z.string().describe('e.g. "Teal & Orange Blockbuster", "Bleach Bypass Documentary".'),
  liftRGB: z.tuple([z.number(), z.number(), z.number()]),
  gammaRGB: z.tuple([z.number(), z.number(), z.number()]),
  gainRGB: z.tuple([z.number(), z.number(), z.number()]),
  saturation: z.number().min(0).max(2),
  contrast: z.number().min(0).max(2),
});
export type LUTSpec = z.infer<typeof LUTSpecSchema>;

export const ColorGradeDirectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  openingGrade: LUTSpecSchema.describe('Grade for Act 1 / setup shots.'),
  climaxGrade: LUTSpecSchema.describe('Grade for the film\'s midpoint-rupture / climax beats.'),
  resolutionGrade: LUTSpecSchema.describe('Grade for the final shots.'),
  perSceneOverrides: z
    .array(
      z.object({
        sceneNumber: z.number().int(),
        lut: LUTSpecSchema,
        reason: z.string(),
      }),
    )
    .default([]),
  stylisticNotes: z.array(z.string()).describe('Free-form director-of-photography notes.'),
  referenceFilms: z.array(z.string()),
});
export type ColorGradeDirection = z.infer<typeof ColorGradeDirectionSchema>;
