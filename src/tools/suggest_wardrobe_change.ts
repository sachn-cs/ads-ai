import { z } from 'zod';
import { invokeStructuredAgent } from '@/src/agents/invoke';
import type { TextProviderConfig } from '@/src/types';
import { getCharacter } from '@/src/db/characters';

export const WardrobeChangeSchema = z.object({
  changes: z.array(
    z.object({
      sceneRange: z.string(),
      outfitLabel: z.string(),
      intent: z.string(),
    }),
  ),
  rationale: z.string(),
});
export type WardrobeChange = z.infer<typeof WardrobeChangeSchema>;

export async function toolSuggestWardrobeChange(
  cfg: TextProviderConfig,
  characterId: string,
  reason: string,
): Promise<WardrobeChange | null> {
  const character = getCharacter(characterId);
  if (!character) return null;
  const { output } = await invokeStructuredAgent<WardrobeChange>({
    agentId: 'tool_suggest_wardrobe_change',
    cfg,
    systemPrompt: 'Propose wardrobe changes that strengthen character continuity.',
    userPrompt: JSON.stringify({ character, reason }, null, 2),
    schema: WardrobeChangeSchema,
    temperature: 0.5,
  });
  return output;
}
