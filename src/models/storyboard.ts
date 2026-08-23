import { z } from 'zod';
import { CameraMoveEnum, ShotTypeEnum } from './common';

export const StoryboardShotSchema = z.object({
  shotId: z.string().describe('Globally-unique shot id, e.g. "S03-007".'),
  sceneNumber: z.number().int(),
  shotNumberInScene: z.number().int(),
  shotType: ShotTypeEnum,
  cameraMove: CameraMoveEnum,
  lensMm: z.number().int().min(8).max(400).describe('Focal length. 24 = wide, 50 = normal, 85 = portrait.'),
  aperture: z.string().describe('e.g. "T2.8", "T4".'),
  durationSeconds: z.number().min(0.5).max(60),
  description: z.string().describe('What we see, in one paragraph.'),
  action: z.string().describe('Motion inside the frame.'),
  subjectCharacterIds: z.array(z.string()).default([]),
  propsInFrame: z.array(z.string()).default([]),
  soundIntent: z.string().describe('Sound design intent (e.g. "distant horn swell").'),
  renderProviderHint: z
    .enum(['veo', 'sora', 'runway'])
    .optional()
    .describe('Hint for which render provider is best.'),
  storyboardPanelPrompt: z.string().describe('Image-gen prompt for a storyboard still.'),
});
export type StoryboardShot = z.infer<typeof StoryboardShotSchema>;

export const StoryboardSchema = z.object({
  id: z.string(),
  totalShots: z.number().int().min(1),
  totalSeconds: z.number(),
  pacing: z.object({
    avgShotSeconds: z.number(),
    longestShotSeconds: z.number(),
    shortestShotSeconds: z.number(),
    cutsPerMinute: z.number(),
  }),
  shots: z.array(StoryboardShotSchema).min(1).max(300),
  parallelismNotes: z
    .array(z.string())
    .describe('Shots that can be batch-rendered with the same provider/style.'),
  renderBatches: z
    .array(
      z.object({
        batchId: z.string(),
        provider: z.enum(['veo', 'sora', 'runway']),
        styleTag: z.string().describe('Shared visual style across the batch (e.g. "neon-noir-night").'),
        shotIds: z.array(z.string()),
        rationale: z.string(),
      }),
    )
    .describe('Pre-computed render batches for the parallel Workflow.'),
});
export type Storyboard = z.infer<typeof StoryboardSchema>;
