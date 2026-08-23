import { z } from 'zod';

export const MusicCueSchema = z.object({
  cueId: z.string(),
  name: z.string().describe('Working title for the cue.'),
  inTimecode: z.string().describe('MM:SS in finished film.'),
  outTimecode: z.string(),
  durationSeconds: z.number().min(2),
  emotionalIntent: z.string().describe('What the cue is doing emotionally.'),
  instrumentation: z.array(z.string()).describe('e.g. "felt piano, lo-fi vinyl crackle, brushed snare".'),
  tempoBpm: z.number().min(40).max(220).optional(),
  mode: z.enum(['underscore', 'source', 'diegetic', 'score']),
  lyricsHook: z.string().optional().describe('Singable hook line if any.'),
});
export type MusicCue = z.infer<typeof MusicCueSchema>;

export const ScorePlanSchema = z.object({
  id: z.string(),
  overarchingTheme: z.string().describe('One-line musical thesis for the whole film.'),
  motif: z.object({
    name: z.string(),
    intervals: z.array(z.string()).describe('e.g. ["minor second", "perfect fourth"].'),
    instrumentation: z.array(z.string()),
  }).describe('A signature 4-8 note motif that anchors the film.'),
  cues: z.array(MusicCueSchema).min(1),
  sonicPalette: z.array(z.string()).describe('Master palette of timbres across the film.'),
  referenceTracks: z.array(z.string()).optional(),
  licensingStrategy: z.enum(['original_score', 'library_licensed', 'cc0', 'mixed']),
});
export type ScorePlan = z.infer<typeof ScorePlanSchema>;
