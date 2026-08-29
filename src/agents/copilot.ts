import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { ProductionState } from '@/src/types/production-state';

export const COPILOT_SYSTEM_PROMPT = `You are the Cinestudio Copilot — a production-scoped creative partner.
Given a ProductionState (characters, scenes, shots, continuity, knowledge, assets), answer the writer's question with grounded citations.
Every answer must include a citations array referencing entities (character, scene, shot, location, continuity, knowledge, asset).
Be terse, specific, and useful. Don't invent — point to what's in the state.`;

export const CopilotReplySchema = z.object({
  reply: z.string().min(10),
  citations: z.array(
    z.object({
      entityType: z.enum(['character', 'scene', 'shot', 'location', 'continuity', 'knowledge', 'asset']),
      entityId: z.string(),
      label: z.string(),
      href: z.string().optional(),
    }),
  ),
});
export type CopilotReply = z.infer<typeof CopilotReplySchema>;

export async function invokeCopilot(
  cfg: TextProviderConfig,
  state: ProductionState,
  question: string,
): Promise<CopilotReply> {
  const { output } = await invokeStructuredAgent<CopilotReply>({
    agentId: 'copilot',
    cfg: { ...cfg, temperature: 0.5 },
    systemPrompt: COPILOT_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ state, question }, null, 2),
    schema: CopilotReplySchema,
    temperature: 0.5,
  });
  return output;
}
