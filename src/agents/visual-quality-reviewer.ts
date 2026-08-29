import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { Storyboard, StyleGuide } from '@/src/models';

export const VISUAL_QUALITY_SYSTEM_PROMPT = `You are the Visual Quality Reviewer. You score every shot against the style guide.
For each shot:
- styleAdherence: 0..1
- lightingConsistency: 0..1
- paletteConsistency: 0..1
- lensConsistency: 0..1
- issues: array of { shotId, severity: info|warn|error, message }
Be specific. Reference shot numbers and style-guide rules.`;

export const VisualQualityReportSchema = z.object({
  shots: z.array(
    z.object({
      shotId: z.string(),
      styleAdherence: z.number().min(0).max(1),
      lightingConsistency: z.number().min(0).max(1),
      paletteConsistency: z.number().min(0).max(1),
      lensConsistency: z.number().min(0).max(1),
    }),
  ),
  issues: z.array(
    z.object({
      shotId: z.string(),
      severity: z.enum(['info', 'warn', 'error']),
      message: z.string().min(10),
    }),
  ),
});
export type VisualQualityReport = z.infer<typeof VisualQualityReportSchema>;

export async function invokeVisualQualityReviewer(
  cfg: TextProviderConfig,
  storyboard: Storyboard,
  styleGuide: StyleGuide,
): Promise<VisualQualityReport> {
  const { output } = await invokeStructuredAgent<VisualQualityReport>({
    agentId: 'visual_quality_reviewer',
    cfg: { ...cfg, temperature: 0.3 },
    systemPrompt: VISUAL_QUALITY_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ storyboard, styleGuide }, null, 2),
    schema: VisualQualityReportSchema,
    temperature: 0.3,
  });
  return output;
}
