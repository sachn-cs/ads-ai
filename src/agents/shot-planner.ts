import { Agent } from '@strands-agents/sdk';
import { z } from 'zod';
import {
  RenderBatchPlanSchema,
  type RenderBatchPlan,
} from '@/src/models';
import { SHOT_PLANNER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type {
  CinestudioBrief,
  ScriptBreakdown,
  CharacterCast,
  WorldDesign,
  Storyboard,
  RenderProviderConfig,
} from '@/src/models';

export const shotPlannerSpec = {
  id: 'shot_planner',
  description:
    'Render prompt architect. Turns storyboard shots into provider-aware render batches.',
  systemPrompt: SHOT_PLANNER_SYSTEM_PROMPT,
};

const AvailableProvidersSchema = z.object({
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
  const agent = new Agent({
    id: shotPlannerSpec.id,
    description: shotPlannerSpec.description,
    systemPrompt: shotPlannerSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.5 }),
    printer: false,
  });
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
      } satisfies z.infer<typeof AvailableProvidersSchema>,
      null,
      2,
    ),
    '\nProduce RenderBatchPlan[] honoring provider availability. Only assign to ENABLED providers.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: z.array(RenderBatchPlanSchema),
  });
  return z.array(RenderBatchPlanSchema).parse(result.structuredOutput);
}
