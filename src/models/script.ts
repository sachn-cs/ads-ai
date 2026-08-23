import { z } from 'zod';

export const DialogueCueSchema = z.object({
  characterId: z.string(),
  delivery: z.string().describe('Delivery direction (e.g. "whispered, with a smile").'),
  line: z.string().describe('Spoken line.'),
  offscreen: z.boolean().optional(),
});
export type DialogueCue = z.infer<typeof DialogueCueSchema>;

export const VoiceoverCueSchema = z.object({
  voice: z.enum(['protagonist', 'antagonist', 'narrator', 'ensemble', 'witness', 'chorus']),
  delivery: z.string().describe('Delivery direction.'),
  line: z.string(),
  timecode: z.string().describe('In-scene timestamp MM:SS.'),
});
export type VoiceoverCue = z.infer<typeof VoiceoverCueSchema>;

export const SceneSchema = z.object({
  sceneNumber: z.number().int().min(1).describe('1-indexed scene ordinal.'),
  slugline: z.string().describe('Caps: INT./EXT. LOCATION - TIME. (e.g. "EXT. DOCK - GOLDEN HOUR").'),
  locationId: z.string().describe('References WorldDesign.locations[].id.'),
  beatPurpose: z.string().describe('What this scene accomplishes in the story (conflict / reveal / shift).'),
  durationSeconds: z.number().min(1).max(60).describe('Planned in-scene duration.'),
  beats: z.array(z.string()).min(2).describe('Bullet beats the scene must hit.'),
  dialogue: z.array(DialogueCueSchema).default([]),
  voiceover: z.array(VoiceoverCueSchema).default([]),
  action: z.string().describe('Action lines — what happens on screen.'),
  imagePremise: z.string().describe('A single sentence image that the scene delivers.'),
  exitState: z.string().describe('What has changed for the characters at scene end.'),
});
export type Scene = z.infer<typeof SceneSchema>;

export const ScriptBreakdownSchema = z.object({
  id: z.string(),
  title: z.string().describe('Working title of the screenplay.'),
  logline: z.string(),
  structure: z
    .array(
      z.object({
        name: z.string().describe('e.g. "Cold Open", "Inciting Incident", "Midpoint".'),
        sceneRange: z.tuple([z.number().int(), z.number().int()]).describe('[startScene, endScene].'),
        tensionDelta: z.number().describe('Tension shift (-1..+1).'),
      }),
    )
    .describe('Three-act beat map referencing scene numbers.'),
  totalEstimatedRuntimeSeconds: z.number(),
  scenes: z.array(SceneSchema).min(1).max(40),
  dialogueRatioTarget: z.number().min(0).max(1).describe('Target fraction of runtime that is spoken.'),
  continuityNotes: z.array(z.string()).describe('Continuity traps to watch (prop moving, time of day, etc.).'),
});
export type ScriptBreakdown = z.infer<typeof ScriptBreakdownSchema>;
