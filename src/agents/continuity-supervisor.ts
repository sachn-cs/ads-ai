import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { Storyboard } from '@/src/models';

export const CONTINUITY_SUPERVISOR_SYSTEM_PROMPT = `You are the Continuity Supervisor. You fan out across wardrobe, object, spatial, emotional, and temporal continuity.
Output a continuity log. For each entry:
- kind: wardrobe | object | spatial | emotional | temporal
- severity: info | warn | error
- sceneId, shotId, characterId (any may be null)
- message: short, specific, actionable

Focus on issues a careful viewer would catch: outfit mismatches, prop continuity, spatial orientation, emotional tone shifts, time-of-day jumps.`;

export const SupervisorReportSchema = z.object({
  entries: z.array(
    z.object({
      kind: z.enum(['wardrobe', 'object', 'spatial', 'emotional', 'temporal']),
      severity: z.enum(['info', 'warn', 'error']),
      sceneId: z.string().nullable().optional(),
      shotId: z.string().nullable().optional(),
      characterId: z.string().nullable().optional(),
      message: z.string().min(10),
    }),
  ),
});
export type SupervisorReport = z.infer<typeof SupervisorReportSchema>;

export async function invokeContinuitySupervisor(
  cfg: TextProviderConfig,
  storyboard: Storyboard,
): Promise<SupervisorReport> {
  const { output } = await invokeStructuredAgent<SupervisorReport>({
    agentId: 'continuity_supervisor',
    cfg: { ...cfg, temperature: 0.3 },
    systemPrompt: CONTINUITY_SUPERVISOR_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ storyboard }, null, 2),
    schema: SupervisorReportSchema,
    temperature: 0.3,
  });
  return output;
}
