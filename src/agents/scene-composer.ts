import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { ScriptBreakdown } from '@/src/models';

export const SCENE_COMPOSER_SYSTEM_PROMPT = `You are the Scene Composer. You break a script into discrete scenes.
For each scene output:
- number: order
- title: short title
- locationId: null if new (will be created by Environment Designer)
- beatSummary: 1-3 sentence summary
- characterIds: characters present
- emotionalIntent: the desired audience feeling
- pacing: tight | measured | languid | rushed
- orderIndex: 0-based position`;

export const SceneListSchema = z.object({
  scenes: z.array(
    z.object({
      number: z.number().int().min(1),
      title: z.string().min(3),
      locationId: z.string().nullable(),
      beatSummary: z.string().min(20),
      characterIds: z.array(z.string()),
      emotionalIntent: z.string().min(10),
      pacing: z.enum(['tight', 'measured', 'languid', 'rushed']),
      orderIndex: z.number().int().min(0),
    }),
  ),
});
export type SceneList = z.infer<typeof SceneListSchema>;

export async function invokeSceneComposer(
  cfg: TextProviderConfig,
  script: ScriptBreakdown,
): Promise<SceneList> {
  const { output } = await invokeStructuredAgent<SceneList>({
    agentId: 'scene_composer',
    cfg: { ...cfg, temperature: 0.6 },
    systemPrompt: SCENE_COMPOSER_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ script }, null, 2),
    schema: SceneListSchema,
    temperature: 0.6,
  });
  return output;
}
