import { z } from 'zod';

export const LocationDesignSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['interior', 'exterior', 'mixed', 'liminal', 'vehicular', 'virtual']),
  geography: z.string().describe('Locale (e.g. "Pacific Northwest coastline", "off-world colony").'),
  era: z.string().describe('Time period (e.g. "contemporary", "near-future 2049").'),
  mood: z.string().describe('Emotional atmosphere of the location.'),
  palette: z.object({
    dominantHues: z.array(z.string()),
    lightDirection: z.string(),
    timeOfDay: z.enum(['dawn', 'morning', 'midday', 'afternoon', 'golden_hour', 'dusk', 'night', 'blue_hour', 'variable']),
  }),
  texture: z.array(z.string()).describe('Materials and surfaces (wet asphalt, polished steel, peeling paint, etc.).'),
  keyProps: z.array(z.string()).describe('Signature objects that ground the location.'),
  soundBed: z.array(z.string()).describe('Ambient sound signature (rain on tin, distant highway hum).'),
  referenceSeed: z.string().describe('Stable visual description for cross-shot continuity.'),
});
export type LocationDesign = z.infer<typeof LocationDesignSchema>;

export const WorldDesignSchema = z.object({
  id: z.string(),
  name: z.string().describe('World title (often = film title).'),
  premise: z.string().describe('What kind of world this is, in 1-2 sentences.'),
  rules: z.array(z.string()).describe('World rules / physics / social norms that constrain the story.'),
  locations: z.array(LocationDesignSchema).min(1).max(20),
  colorWorld: z.object({
    palette: z.array(z.string()).describe('Master palette across whole film.'),
    paletteShift: z
      .string()
      .describe('How palette evolves from act 1 -> 3 (e.g. "cool mono -> warm saturation").'),
  }),
  recurringVisualMotifs: z.array(z.string()).describe('Repeating visual throughlines.'),
  soundWorld: z.object({
    palette: z.array(z.string()).describe('Signature sound elements.'),
    musicStylistics: z.array(z.string()).describe('Stylistic notes for the Composer.'),
  }),
});
export type WorldDesign = z.infer<typeof WorldDesignSchema>;
