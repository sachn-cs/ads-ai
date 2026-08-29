import { z } from 'zod';
import { invokeStructuredAgent } from '@/src/agents/invoke';
import type { TextProviderConfig } from '@/src/types';

export const SceneRevisionSchema = z.object({
  sceneId: z.string(),
  before: z.string(),
  after: z.string(),
  rationale: z.string(),
});
export type SceneRevision = z.infer<typeof SceneRevisionSchema>;

export async function toolDraftSceneRevision(
  cfg: TextProviderConfig,
  sceneBefore: string,
  directive: string,
): Promise<SceneRevision> {
  const { output } = await invokeStructuredAgent<SceneRevision>({
    agentId: 'tool_draft_scene_revision',
    cfg,
    systemPrompt: 'Draft a scene revision. Output {sceneId, before, after, rationale}.',
    userPrompt: JSON.stringify({ sceneBefore, directive }, null, 2),
    schema: SceneRevisionSchema,
    temperature: 0.6,
  });
  return output;
}
