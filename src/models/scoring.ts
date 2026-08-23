import { z } from 'zod';
import { QualityDecisionEnum } from './common';

export const ShotDecisionSchema = z.object({
  shotId: z.string(),
  decision: QualityDecisionEnum,
  score: z.number().min(0).max(100),
  blockingReasons: z.array(z.string()).default([]),
});
export type ShotDecision = z.infer<typeof ShotDecisionSchema>;

export const CompositeQualityReportSchema = z.object({
  id: z.string(),
  overallScore: z.number().min(0).max(100),
  overallDecision: QualityDecisionEnum,
  passingThreshold: z.number().min(0).max(100),
  shotDecisions: z.array(ShotDecisionSchema),
  compositeByDimension: z
    .record(
      z.string(),
      z.object({
        score: z.number(),
        variance: z.number(),
        blockerShotIds: z.array(z.string()),
      }),
    )
    .describe('Aggregate by dimension across all evaluated shots.'),
  cycleNumber: z.number().int().min(1),
  recommendation: z.enum(['proceed', 'iterate', 'halt']),
  generatedAt: z.string(),
});
export type CompositeQualityReport = z.infer<typeof CompositeQualityReportSchema>;
