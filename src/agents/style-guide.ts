import { StyleGuideSchema, type StyleGuide } from '@/src/models';
import { STYLE_GUIDE_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeMiniMaxAnthropic } from '@/src/providers/minimax/text';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief } from '@/src/models';
import { ulid } from '@/src/lib/id';
import { logger } from '@/src/lib/logger';

const log = logger('agents/style-guide');

export const styleGuideSpec = {
  id: 'style_guide',
  description: 'Produces a StyleGuide that constrains every downstream visual agent to one coherent cinematic look.',
};

export async function invokeStyleGuide(
  cfg: TextProviderConfig,
  brief: CinestudioBrief,
): Promise<StyleGuide> {
  log.info('style_guide_invoking', { briefId: brief.id });
  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: cfg.apiKey ?? '',
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      temperature: cfg.temperature ?? 0.6,
      maxTokens: cfg.maxTokens ?? 4096,
    },
    {
      system: STYLE_GUIDE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `CINESTUDIO BRIEF:\n${JSON.stringify(brief, null, 2)}\n\nProduce the StyleGuide JSON.`,
        },
      ],
    },
  );
  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('StyleGuide produced unparseable output');
  const raw = JSON.parse(jsonMatch[0]);
  const id = raw.id ?? ulid();
  return StyleGuideSchema.parse({ ...raw, id });
}
