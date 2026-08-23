import { z } from 'zod';
import { ShotCritiqueSchema } from './critique';

export const ShotRefinementDirectiveSchema = z.object({
  shotId: z.string(),
  prioritizedIssues: z.array(
    z.object({
      issue: z.string(),
      impact: z.enum(['low', 'medium', 'high', 'critical']),
    }),
  ),
  surgicalEdits: z.array(z.string()).describe('Specific line-edits or prompt rewrites.'),
  preserveInstructions: z.array(z.string()).describe('What NOT to change.'),
  expectedOutcome: z.string(),
});
export type ShotRefinementDirective = z.infer<typeof ShotRefinementDirectiveSchema>;

export const IterationControlReportSchema = z.object({
  id: z.string(),
  cycleNumber: z.number().int().min(1),
  shotDirectives: z.array(ShotRefinementDirectiveSchema),
  globalStrategy: z.string().describe('Cross-cutting strategy for this cycle.'),
  maxCycles: z.number().int(),
  shouldContinue: z.boolean(),
  terminationReason: z.string().optional(),
  generatedAt: z.string(),
  sourceCritiqueId: z.string(),
});
export type IterationControlReport = z.infer<typeof IterationControlReportSchema>;

export { ShotCritiqueSchema };
