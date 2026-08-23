import { z } from 'zod';

export const StyleGuideSchema = z.object({
  id: z.string(),
  title: z.string().describe('Short title like "neon-noir", "golden hour realism", etc.'),
  cinematicReferences: z
    .array(z.string())
    .describe('Films or works we are taking cues from (cite, never copy).'),
  palette: z.object({
    primaryHues: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(3).max(8),
    accentHues: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(6).default([]),
    mood: z.string().describe('One sentence on the emotional temperature of the palette.'),
  }),
  lighting: z.object({
    keyDirection: z.string().describe('e.g. "low-angle warm key from screen-left".'),
    colorTemperature: z.enum(['warm', 'cool', 'neutral']),
    contrastMood: z.enum(['low', 'medium', 'high', 'extreme']),
    shadows: z.string().describe('Soft / hard / colored; what fills the shadows.'),
  }),
  lensing: z.object({
    preferredFocalLengthMm: z.array(z.number().int()).describe('e.g. [24, 35, 50, 85]'),
    apertureBias: z.enum(['shallow', 'medium', 'deep']),
    movementStyle: z.string().describe('e.g. "static frames, slow push-ins, locked tripod".'),
  }),
  grainAndTexture: z.object({
    grainLevel: z.enum(['none', 'subtle', 'pronounced', 'heavy']),
    stockReference: z.string().describe('e.g. "Kodak Vision3 500T".'),
    lensCharacter: z.string().describe('e.g. "vintage Panavision halation".'),
  }),
  referenceImageHints: z
    .array(z.string())
    .max(5)
    .describe('Short, evocative description strings used to seed character/world/storyboard agents.'),
  globalConstraints: z
    .array(z.string())
    .describe('Hard rules every downstream shot must follow (e.g. "no daylight in act 1").'),
});
export type StyleGuide = z.infer<typeof StyleGuideSchema>;
