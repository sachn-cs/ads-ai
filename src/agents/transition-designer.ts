import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { Storyboard } from '@/src/models';

export const TRANSITION_SYSTEM_PROMPT = `You are the Transition Designer. You assign the cut between every shot in a storyboard.
For each transition, output:
- fromShotId, toShotId
- type: cut | dissolve | fade | wipe | match | jump | L-cut | J-cut
- intent: emotional / narrative / rhythmic purpose
- continuityNotes: what must hold across the cut
Choose cuts that preserve flow and audience immersion. Use dissolves for time/mood, L-cuts for dialogue continuity, hard cuts for tension.`;

export const TransitionPlanSchema = z.object({
  transitions: z.array(
    z.object({
      fromShotId: z.string(),
      toShotId: z.string(),
      type: z.enum(['cut', 'dissolve', 'fade', 'wipe', 'match', 'jump', 'L-cut', 'J-cut']),
      intent: z.string().min(20),
      continuityNotes: z.string().optional(),
    }),
  ),
});
export type TransitionPlan = z.infer<typeof TransitionPlanSchema>;

export async function invokeTransitionDesigner(
  cfg: TextProviderConfig,
  storyboard: Storyboard,
): Promise<TransitionPlan> {
  const { output } = await invokeStructuredAgent<TransitionPlan>({
    agentId: 'transition_designer',
    cfg: { ...cfg, temperature: 0.6 },
    systemPrompt: TRANSITION_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ storyboard }, null, 2),
    schema: TransitionPlanSchema,
    temperature: 0.6,
  });
  return output;
}
