import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { ScriptBreakdown } from '@/src/models';

export const SCENE_EDITOR_SYSTEM_PROMPT = `You are the Scene Editor. You rewrite scenes to strengthen cause and effect, beat density, and dialogue-vs-action ratio.
For each scene, return:
- sceneId
- before: current scene summary
- after: rewritten scene summary
- rationale: why the rewrite improves cause/effect or beat density

Prefer showing-not-telling, sharpening character intent, and removing beats that don't advance the story.`;

export const SceneRevisionSchema = z.object({
  revisions: z.array(
    z.object({
      sceneId: z.string(),
      before: z.string().min(10),
      after: z.string().min(10),
      rationale: z.string().min(10),
    }),
  ),
});
export type SceneRevisions = z.infer<typeof SceneRevisionSchema>;

export async function invokeSceneEditor(
  cfg: TextProviderConfig,
  script: ScriptBreakdown,
): Promise<SceneRevisions> {
  const { output } = await invokeStructuredAgent<SceneRevisions>({
    agentId: 'scene_editor',
    cfg: { ...cfg, temperature: 0.6 },
    systemPrompt: SCENE_EDITOR_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ script }, null, 2),
    schema: SceneRevisionSchema,
    temperature: 0.6,
  });
  return output;
}
