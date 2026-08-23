import { z } from 'zod';

export const RenderDirectivePatchSchema = z.object({
  shotId: z.string(),
  originalPrompt: z.string().describe('The prompt the ShotPlanner generated.'),
  revisedPrompt: z.string().describe('The prompt after RenderDirector tweaks for visual coherence.'),
  reason: z.string().describe('Why the change was made (e.g. "match adjacent shot palette").'),
  lockedFields: z
    .array(z.enum(['provider', 'model', 'aspectRatio', 'duration', 'referenceSeed']))
    .describe('Fields downstream must not change.'),
});

export const RenderDirectiveSchema = z.object({
  id: z.string(),
  shotPatches: z.array(RenderDirectivePatchSchema),
  crossShotNotes: z
    .array(z.string())
    .describe('Free-form notes for downstream agents (continuity_checker, critique, etc.).'),
  appliesToCycle: z.number().int().min(1).default(1),
  generatedAt: z.string(),
});
export type RenderDirective = z.infer<typeof RenderDirectiveSchema>;
export type RenderDirectivePatch = z.infer<typeof RenderDirectivePatchSchema>;
