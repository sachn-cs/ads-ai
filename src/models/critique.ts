import { z } from 'zod';
import { EvaluationDimensionEnum, QualityDecisionEnum } from './common';

export const DimensionScoreSchema = z.object({
  dimension: EvaluationDimensionEnum,
  score: z.number().min(0).max(100),
  rationale: z.string().describe('Specific evidence supporting the score.'),
  criticalIssue: z.boolean().default(false).describe('Whether this dimension blocks production.'),
});
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

export const ShotCritiqueSchema = z.object({
  shotId: z.string(),
  overallScore: z.number().min(0).max(100),
  dimensions: z.array(DimensionScoreSchema).min(3),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedFixes: z
    .array(z.object({
      target: z.string().describe('What to change (camera / lighting / text / VO / etc.).'),
      rationale: z.string(),
      expectedLift: z.number().min(0).max(50).describe('Estimated score lift if applied.'),
    })),
  decision: QualityDecisionEnum,
});
export type ShotCritique = z.infer<typeof ShotCritiqueSchema>;

export const CritiqueReportSchema = z.object({
  id: z.string(),
  totalShotsReviewed: z.number().int(),
  goCount: z.number().int(),
  conditionalGoCount: z.number().int(),
  noGoCount: z.number().int(),
  perShot: z.array(ShotCritiqueSchema),
  globalObservations: z.array(z.string()).describe('Cross-cutting issues (continuity, pacing arc).'),
  generatedAt: z.string(),
});
export type CritiqueReport = z.infer<typeof CritiqueReportSchema>;
