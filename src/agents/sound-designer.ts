import { Agent } from '@strands-agents/sdk';
import { SoundDesignPlanSchema, type SoundDesignPlan } from '@/src/models';
import { SOUND_DESIGNER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type {
  ScriptBreakdown,
  ScorePlan,
  SoundDesignPlan as _SoundDesignPlan,
  Storyboard,
  WorldDesign,
} from '@/src/models';

export const soundDesignerSpec = {
  id: 'sound_designer',
  description:
    'Sound designer. Plans ambient beds, foley, hard effects, and intentional silences.',
  systemPrompt: SOUND_DESIGNER_SYSTEM_PROMPT,
};

export interface SoundDesignerInput {
  script: ScriptBreakdown;
  world: WorldDesign;
  scorePlan: ScorePlan;
  storyboard: Storyboard;
  previous?: _SoundDesignPlan;
}

export async function invokeSoundDesigner(
  cfg: TextProviderConfig,
  input: SoundDesignerInput,
): Promise<SoundDesignPlan> {
  const agent = new Agent({
    id: soundDesignerSpec.id,
    description: soundDesignerSpec.description,
    systemPrompt: soundDesignerSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.6 }),
    printer: false,
  });
  const prompt = [
    'SCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nWORLD DESIGN:',
    JSON.stringify(input.world, null, 2),
    '\nSCORE PLAN:',
    JSON.stringify(input.scorePlan, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    input.previous ? `\nPREVIOUS SOUND PLAN:\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a SoundDesignPlan.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: SoundDesignPlanSchema,
  });
  return SoundDesignPlanSchema.parse(result.structuredOutput);
}
