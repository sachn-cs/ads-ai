import { z } from 'zod';

export const EditDecisionSchema = z.object({
  shotId: z.string(),
  inSeconds: z.number().min(0).describe('In-point within the rendered shot (trim from start).'),
  outSeconds: z.number().min(0),
  transitionToNext: z.enum(['cut', 'fade', 'dissolve', 'wipe', 'match_cut', 'jump_cut', 'smash_cut']),
  transitionDuration: z.number().min(0).max(2).describe('Seconds of transition.'),
  rationale: z.string(),
});
export type EditDecision = z.infer<typeof EditDecisionSchema>;

export const PacingReportSchema = z.object({
  totalRuntimeSeconds: z.number(),
  beatsPerMinute: z.number(),
  emotionalCurve: z
    .array(z.object({ timecode: z.string(), intensity: z.number().min(0).max(1) }))
    .describe('Intensity over time.'),
  actDistribution: z.object({
    setupSeconds: z.number(),
    confrontationSeconds: z.number(),
    resolutionSeconds: z.number(),
  }),
});
export type PacingReport = z.infer<typeof PacingReportSchema>;

export const AssemblyPlanSchema = z.object({
  id: z.string(),
  editDecisions: z.array(EditDecisionSchema),
  pacing: PacingReportSchema,
  audioBedPlan: z.object({
    ambience: z.array(z.string()),
    foleyCues: z.array(z.string()),
    musicCues: z.array(z.string()),
    dialogueCues: z.array(z.string()),
  }),
  recommendedTools: z.array(
    z.enum([
      'ffmpeg_concat',
      'shotstack_api',
      'creatify_api',
      'davinci_resolve_xml',
      'premiere_xml',
    ]),
  ),
  exportInstructions: z.string(),
});
export type AssemblyPlan = z.infer<typeof AssemblyPlanSchema>;
