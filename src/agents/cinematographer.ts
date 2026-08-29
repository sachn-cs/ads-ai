import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { Storyboard } from '@/src/models';

export const CINEMATOGRAPHER_SYSTEM_PROMPT = `You are the Cinematographer. You own the camera language of the film.
For every scene, output:
- lensSet: which focal lengths serve this scene and why
- movementVocabulary: dolly / pan / tilt / handheld / static / push-in / pull-back / tracking
- depthCues: foreground / midground / background separation strategy
- focusPulls: where focus shifts happen
- framingRules: rule-of-thirds, symmetry, leading lines, headroom

Maintain visual coherence across scenes — every cut should feel intentional.`;

export const CinematographyPlanSchema = z.object({
  scenes: z.array(
    z.object({
      sceneId: z.string(),
      lensSet: z.array(z.string()).min(1),
      movementVocabulary: z.array(z.string()).min(1),
      depthCues: z.string().min(20),
      focusPulls: z.array(
        z.object({
          fromSubject: z.string(),
          toSubject: z.string(),
          cue: z.string(),
        }),
      ),
      framingRules: z.array(z.string()).min(1),
    }),
  ),
});
export type CinematographyPlan = z.infer<typeof CinematographyPlanSchema>;

export async function invokeCinematographer(
  cfg: TextProviderConfig,
  storyboard: Storyboard,
): Promise<CinematographyPlan> {
  const { output } = await invokeStructuredAgent<CinematographyPlan>({
    agentId: 'cinematographer',
    cfg: { ...cfg, temperature: 0.6 },
    systemPrompt: CINEMATOGRAPHER_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ storyboard }, null, 2),
    schema: CinematographyPlanSchema,
    temperature: 0.6,
  });
  return output;
}
