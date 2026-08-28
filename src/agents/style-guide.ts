import { StyleGuideSchema, type StyleGuide } from '@/src/models';
import { STYLE_GUIDE_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief } from '@/src/models';
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
  const { output } = await invokeStructuredAgent<StyleGuide>({
    agentId: 'style_guide',
    cfg: { ...cfg, temperature: 0.6, maxTokens: 16384 },
    systemPrompt: STYLE_GUIDE_SYSTEM_PROMPT,
    userPrompt: `CINESTUDIO BRIEF:\n${JSON.stringify(brief, null, 2)}\n\nProduce the StyleGuide JSON.`,
    schema: StyleGuideSchema,
    temperature: 0.6,
  });
  return output;
}