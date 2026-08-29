import { z } from 'zod';
import { invokeStructuredAgent } from '@/src/agents/invoke';
import type { TextProviderConfig } from '@/src/types';

export const ComparisonSchema = z.object({
  options: z.array(
    z.object({
      label: z.string(),
      summary: z.string(),
      tradeoff: z.string(),
    }),
  ),
  recommendation: z.string(),
});
export type Comparison = z.infer<typeof ComparisonSchema>;

export async function toolCompareAlternatives(
  cfg: TextProviderConfig,
  topic: string,
  context: unknown,
): Promise<Comparison> {
  const { output } = await invokeStructuredAgent<Comparison>({
    agentId: 'tool_compare_alternatives',
    cfg,
    systemPrompt: 'Compare 2-4 alternatives for the topic. Be concrete about tradeoffs.',
    userPrompt: JSON.stringify({ topic, context }, null, 2),
    schema: ComparisonSchema,
    temperature: 0.5,
  });
  return output;
}
