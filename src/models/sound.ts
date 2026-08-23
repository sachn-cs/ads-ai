import { z } from 'zod';

export const FoleyCueSchema = z.object({
  cueId: z.string(),
  name: z.string(),
  timecode: z.string().describe('MM:SS.'),
  durationSeconds: z.number().min(0).max(5),
  material: z.string().describe('e.g. "footsteps on wet gravel".'),
  perceptualIntent: z.string(),
});
export type FoleyCue = z.infer<typeof FoleyCueSchema>;

export const AmbientBedSchema = z.object({
  locationId: z.string(),
  signature: z.array(z.string()).describe('Persistent ambient sound design.'),
  dynamicLayers: z.array(z.string()).describe('Layers that shift with narrative.'),
});
export type AmbientBed = z.infer<typeof AmbientBedSchema>;

export const SoundDesignPlanSchema = z.object({
  id: z.string(),
  ambientBeds: z.array(AmbientBedSchema),
  foleyCues: z.array(FoleyCueSchema),
  hardEffects: z.array(z.object({
    name: z.string(),
    timecode: z.string(),
    description: z.string(),
  })),
  silenceMap: z
    .array(
      z.object({
        inTimecode: z.string(),
        outTimecode: z.string(),
        intent: z.string(),
      }),
    )
    .describe('Intentional silences and their meaning.'),
  technicalNotes: z.array(z.string()).describe('LUFS target (-23 broadcast, -14 streaming), mix priorities.'),
});
export type SoundDesignPlan = z.infer<typeof SoundDesignPlanSchema>;
