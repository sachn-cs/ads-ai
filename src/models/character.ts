import { z } from 'zod';

export const VoiceToneSchema = z.object({
  pace: z.enum(['deliberate', 'measured', 'brisk', 'rapid']),
  register: z.enum(['formal', 'colloquial', 'archaic', 'street', 'poetic', 'laconic']),
  accent: z.string().optional().describe('Accent/region implied (e.g. "neutral American", "Belfast").'),
  quirks: z.array(z.string()).optional(),
});
export type VoiceTone = z.infer<typeof VoiceToneSchema>;

export const CharacterSchema = z.object({
  id: z.string().describe('Character identifier used across scenes.'),
  name: z.string(),
  role: z.enum(['protagonist', 'antagonist', 'mentor', 'foil', 'ensemble', 'narrator', 'witness']),
  archetype: z.string().describe('One-line archetype (e.g. "reluctant hero", "weary detective").'),
  age: z.string().describe('Age bucket e.g. "early 30s" — never specific age unless given.'),
  appearance: z.object({
    ethnicity: z.string().optional(),
    bodyType: z.string().optional(),
    wardrobe: z.array(z.string()).describe('Wardrobe silhouette + key garments per mood.'),
    distinguishingMarks: z.array(z.string()).optional(),
    visualHook: z.string().describe('Single image-defining detail used for visual reference (e.g. "ink-stained cuffs, faded denim jacket").'),
  }),
  voice: VoiceToneSchema.optional(),
  internalWound: z.string().describe('Core emotional need/conflict.'),
  externalWant: z.string().describe('Concrete goal the character pursues.'),
  arc: z.string().describe('What changes for the character by the end.'),
  referenceSeed: z
    .string()
    .describe('Stable visual description string for continuity across renders (never a real person).'),
});
export type Character = z.infer<typeof CharacterSchema>;

export const CharacterCastSchema = z.object({
  characters: z.array(CharacterSchema).min(1).max(20),
  ensembleTension: z.string().describe('Inter-character conflicts and alliances.'),
  visualConsistencyNotes: z
    .array(z.string())
    .describe('Notes to keep characters visually distinct across shots.'),
});
export type CharacterCast = z.infer<typeof CharacterCastSchema>;
