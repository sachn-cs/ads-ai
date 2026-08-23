import { z } from 'zod';

export const RightsIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'warning', 'blocker']),
  area: z.enum([
    'likeness',
    'trademark',
    'copyrighted_music',
    'copyrighted_image',
    'public_location_permit',
    'language_offense',
    'platform_policy',
    'safety',
  ]),
  description: z.string(),
  affectedShotIds: z.array(z.string()).default([]),
  affectedSceneNumbers: z.array(z.number().int()).default([]),
  suggestedMitigation: z.string(),
});
export type RightsIssue = z.infer<typeof RightsIssueSchema>;

export const RightsReportSchema = z.object({
  id: z.string(),
  overallStatus: z.enum(['cleared', 'needs_review', 'blocked']),
  issues: z.array(RightsIssueSchema),
  platformPolicies: z
    .array(
      z.object({
        platform: z.string(),
        policy: z.string(),
        compliance: z.enum(['compliant', 'review_needed', 'non_compliant']),
        notes: z.string(),
      }),
    )
    .default([]),
  signedOffAt: z.string().optional(),
  generatedAt: z.string(),
});
export type RightsReport = z.infer<typeof RightsReportSchema>;
