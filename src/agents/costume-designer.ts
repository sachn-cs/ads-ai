import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { CharacterCast } from '@/src/models';

export const COSTUME_SYSTEM_PROMPT = `You are the Costume Designer. Your job is to refine wardrobe logic for each character in a film.
Output a CharacterCast where each character has:
- costumeIntent: what the wardrobe communicates (power, vulnerability, social class, time period)
- outfitVariants: 2-4 outfit options with scene-tagged notes
- continuityRules: rules the Costume Designer enforces across scenes
Be specific, intentional, and visually literate. Reference materials (fabric, texture, era, color).`;

export const CostumeRevisionSchema = z.object({
  characters: z.array(
    z.object({
      id: z.string(),
      costumeIntent: z.string().min(20),
      outfitVariants: z.array(
        z.object({
          label: z.string(),
          sceneRange: z.string().optional(),
          notes: z.string().min(10),
        }),
      ),
      continuityRules: z.array(z.string()),
    }),
  ),
});
export type CostumeRevision = z.infer<typeof CostumeRevisionSchema>;

export async function invokeCostumeDesigner(
  cfg: TextProviderConfig,
  cast: CharacterCast,
): Promise<CostumeRevision> {
  const { output } = await invokeStructuredAgent<CostumeRevision>({
    agentId: 'costume_designer',
    cfg: { ...cfg, temperature: 0.7 },
    systemPrompt: COSTUME_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ cast }, null, 2),
    schema: CostumeRevisionSchema,
    temperature: 0.7,
  });
  return output;
}
