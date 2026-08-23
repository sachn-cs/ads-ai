import {
  RenderDirectiveSchema,
  type RenderDirective,
  type CinestudioBrief,
  type Storyboard,
  type ShotRenderInstruction,
} from '@/src/models';
import { RENDER_DIRECTOR_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeMiniMaxAnthropic } from '@/src/providers/minimax/text';
import type { TextProviderConfig } from '@/src/types';
import { ulid } from '@/src/lib/id';
import { logger } from '@/src/lib/logger';

const log = logger('agents/render-director');

export const renderDirectorSpec = {
  id: 'render_director',
  description: 'Reviews shot plans for cross-shot coherence (palette, eyeline, character refs) and rewrites a minimum number of shots.',
};

export interface RenderDirectorInput {
  brief: CinestudioBrief;
  storyboard: Storyboard;
  shotPlans: Array<{
    batchId: string;
    provider: 'veo' | 'sora' | 'runway' | 'minimax';
    instructions: ShotRenderInstruction[];
  }>;
  cycleNumber?: number;
}

export async function invokeRenderDirector(
  cfg: TextProviderConfig,
  input: RenderDirectorInput,
): Promise<RenderDirective> {
  log.info('render_director_invoking', { storyboardId: input.storyboard.id, shotCount: input.shotPlans.reduce((s, b) => s + b.instructions.length, 0) });
  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: cfg.apiKey ?? '',
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      temperature: cfg.temperature ?? 0.4,
      maxTokens: cfg.maxTokens ?? 8192,
    },
    {
      system: RENDER_DIRECTOR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `CINESTUDIO BRIEF:\n${JSON.stringify(input.brief, null, 2)}\n\nSTORYBOARD:\n${JSON.stringify(input.storyboard, null, 2)}\n\nSHOT PLANS (across providers):\n${JSON.stringify(input.shotPlans, null, 2)}\n\nProduce a RenderDirective JSON with surgical patches — empty shotPatches array if no changes needed.`,
        },
      ],
    },
  );
  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('RenderDirector produced unparseable output');
  const raw = JSON.parse(jsonMatch[0]);
  return RenderDirectiveSchema.parse({
    ...raw,
    id: raw.id ?? ulid(),
    appliesToCycle: raw.appliesToCycle ?? input.cycleNumber ?? 1,
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
  });
}
