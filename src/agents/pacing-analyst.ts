import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { ScriptBreakdown } from '@/src/models';

export const PACING_SYSTEM_PROMPT = `You are the Pacing Analyst. You measure the rhythm of a screenplay.
For each scene, compute:
- beatDensity: beats per minute of expected screen time
- averageShotDuration: expected seconds per shot
- pacingTag: tight | measured | languid | rushed
- warnings: array of scene ids where pacing drags or rushes
Surface scenes where tension is unresolved or payoff is missing.`;

export const PacingReportSchema = z.object({
  scenes: z.array(
    z.object({
      sceneId: z.string(),
      beatDensity: z.number().min(0).max(20),
      averageShotDuration: z.number().min(0.5).max(60),
      pacingTag: z.enum(['tight', 'measured', 'languid', 'rushed']),
    }),
  ),
  warnings: z.array(z.string()),
});
export type PacingReport = z.infer<typeof PacingReportSchema>;

export async function invokePacingAnalyst(
  cfg: TextProviderConfig,
  script: ScriptBreakdown,
): Promise<PacingReport> {
  const { output } = await invokeStructuredAgent<PacingReport>({
    agentId: 'pacing_analyst',
    cfg: { ...cfg, temperature: 0.4 },
    systemPrompt: PACING_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ script }, null, 2),
    schema: PacingReportSchema,
    temperature: 0.4,
  });
  return output;
}
