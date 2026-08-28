import { z } from 'zod';
import { CinematographyPaletteSchema } from './common';

const VisualApproachLooseSchema = z.union([
  z.string().min(1),
  CinematographyPaletteSchema,
]);

export const IdeaVariantSchema = z.object({
  id: z.string(),
  index: z.number().int().min(0),
  rationale: z
    .string()
    .min(20)
    .max(800)
    .describe('One-paragraph pitch for why this variant is interesting.'),
  brief: z
    .object({
      logline: z.string().min(20).max(500),
      synopsis: z.string().min(100),
      genre: z.string(),
      tone: z.array(z.string()).min(1),
      targetRuntimeSeconds: z.number().int().min(15),
      creativeNorthStars: z.array(z.string()).min(2).max(7),
      visualApproach: VisualApproachLooseSchema,
      mustHaves: z.array(z.string()),
      avoidances: z.array(z.string()),
    })
    .describe('CinestudioBrief-shaped candidate produced from the user prompt.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Model self-assessed confidence that this variant is producible and coherent.'),
});

export type IdeaVariant = z.infer<typeof IdeaVariantSchema>;

export const IdeaExpansionResultSchema = z.object({
  variants: z.array(IdeaVariantSchema).length(3),
  modelUsed: z.string(),
  generatedAt: z.string(),
});
export type IdeaExpansionResult = z.infer<typeof IdeaExpansionResultSchema>;
