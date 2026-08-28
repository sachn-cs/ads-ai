import { z } from 'zod';
import {
  RenderBatchPlanSchema,
  type RenderBatchPlan,
} from '@/src/models';
import { SHOT_PLANNER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type {
  CinestudioBrief,
  ScriptBreakdown,
  CharacterCast,
  WorldDesign,
  Storyboard,
} from '@/src/models';
import type { RenderProviderConfig } from '@/src/types';

export const shotPlannerSpec = {
  id: 'shot_planner',
  description:
    'Render prompt architect. Turns storyboard shots into provider-aware render batches.',
  systemPrompt: SHOT_PLANNER_SYSTEM_PROMPT,
};

const _AvailableProvidersSchema = z.object({
  veo: z.object({ enabled: z.boolean(), maxConcurrentShots: z.number().min(1) }),
  sora: z.object({ enabled: z.boolean(), maxConcurrentShots: z.number().min(1) }),
  runway: z.object({ enabled: z.boolean(), maxConcurrentShots: z.number().min(1) }),
});

export interface ShotPlannerInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  cast: CharacterCast;
  world: WorldDesign;
  storyboard: Storyboard;
  providers: Record<'veo' | 'sora' | 'runway', RenderProviderConfig>;
}

export async function invokeShotPlanner(
  cfg: TextProviderConfig,
  input: ShotPlannerInput,
): Promise<RenderBatchPlan[]> {
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nCHARACTER CAST:',
    JSON.stringify(input.cast, null, 2),
    '\nWORLD DESIGN:',
    JSON.stringify(input.world, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    '\nAVAILABLE PROVIDERS:',
    JSON.stringify(
      {
        veo: { enabled: input.providers.veo.enabled, maxConcurrentShots: input.providers.veo.maxConcurrentShots },
        sora: { enabled: input.providers.sora.enabled, maxConcurrentShots: input.providers.sora.maxConcurrentShots },
        runway: { enabled: input.providers.runway.enabled, maxConcurrentShots: input.providers.runway.maxConcurrentShots },
      } satisfies z.infer<typeof _AvailableProvidersSchema>,
      null,
      2,
    ),
    '\nProduce RenderBatchPlan[] honoring provider availability. Only assign to ENABLED providers.',
  ].join('\n');
  const { output } = await invokeStructuredAgent<RenderBatchPlan[]>({
    agentId: 'shot_planner',
    cfg: { ...cfg, temperature: 0.5 },
    systemPrompt: SHOT_PLANNER_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: z.array(RenderBatchPlanSchema),
    temperature: 0.5,
  });
  return output;
}