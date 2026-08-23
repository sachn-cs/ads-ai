import { IdeaExpansionResultSchema, type IdeaExpansionResult } from '@/src/models';
import { IDEA_EXPANDER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeMiniMaxAnthropic } from '@/src/providers/minimax/text';
import type { TextProviderConfig } from '@/src/types';
import { logger } from '@/src/lib/logger';
import { ulid } from '@/src/lib/id';

const log = logger('agents/idea-expander');

export const ideaExpanderSpec = {
  id: 'idea_expander',
  description: 'Expands a raw user prompt into 3 distinct CinestudioBrief candidates for the user to pick from.',
};

export async function invokeIdeaExpander(
  cfg: TextProviderConfig,
  userPrompt: string,
  count: number = 3,
): Promise<IdeaExpansionResult> {
  log.info('idea_expander_invoking', { promptLength: userPrompt.length, count });
  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: cfg.apiKey ?? '',
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      temperature: cfg.temperature ?? 0.9,
      maxTokens: cfg.maxTokens ?? 8192,
    },
    {
      system: IDEA_EXPANDER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `USER PROMPT:\n${userPrompt}\n\nProduce EXACTLY ${count} IdeaVariants. Each variant.brief must be a complete CinestudioBrief-shape.`,
        },
      ],
    },
  );

  let parsed: IdeaExpansionResult;
  try {
    const wrapped = {
      variants: JSON.parse(`[${extractJsonArray(result.text)}]`).slice(0, count),
      modelUsed: cfg.model,
      generatedAt: new Date().toISOString(),
    };
    parsed = IdeaExpansionResultSchema.parse(wrapped);
  } catch {
    const m = result.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('IdeaExpander produced unparseable output');
    const obj = JSON.parse(m[0]);
    parsed = IdeaExpansionResultSchema.parse({
      variants: (obj.variants ?? []).slice(0, count),
      modelUsed: cfg.model,
      generatedAt: new Date().toISOString(),
    });
  }

  const now = new Date().toISOString();
  return {
    modelUsed: cfg.model,
    generatedAt: now,
    variants: parsed.variants.slice(0, count).map((v, i) => ({
      ...v,
      id: v.id ?? ulid(),
      index: i,
    })),
  };
}

function extractJsonArray(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return text;
  return text.slice(start, end + 1);
}
