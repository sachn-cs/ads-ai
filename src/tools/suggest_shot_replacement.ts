import { z } from 'zod';
import { invokeStructuredAgent } from '@/src/agents/invoke';
import type { TextProviderConfig } from '@/src/types';
import { getShot } from '@/src/db/shots';

export const ShotReplacementSchema = z.object({
  replacement: z.object({
    framing: z.string(),
    angle: z.string(),
    lens: z.string(),
    shotSize: z.enum(['W', 'MS', 'MCU', 'CU', 'ECU', 'OTS', 'Insert', 'Establishing', 'Tracking']),
    movement: z.string(),
    intent: z.string(),
    rationale: z.string(),
  }),
});
export type ShotReplacement = z.infer<typeof ShotReplacementSchema>;

export async function toolSuggestShotReplacement(
  cfg: TextProviderConfig,
  shotId: string,
  reason: string,
): Promise<ShotReplacement | null> {
  const shot = getShot(shotId);
  if (!shot) return null;
  const { output } = await invokeStructuredAgent<ShotReplacement>({
    agentId: 'tool_suggest_shot_replacement',
    cfg,
    systemPrompt: 'Propose a replacement shot that addresses the reason while preserving intent.',
    userPrompt: JSON.stringify({ shot, reason }, null, 2),
    schema: ShotReplacementSchema,
    temperature: 0.5,
  });
  return output;
}
