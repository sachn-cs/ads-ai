import { Agent } from '@strands-agents/sdk';
import { ScorePlanSchema, type ScorePlan } from '@/src/models';
import { COMPOSER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief, ScriptBreakdown, Storyboard } from '@/src/models';

export const composerSpec = {
  id: 'composer',
  description:
    'Composer. Designs the music cue map with motif, sonic palette, and licensing strategy.',
  systemPrompt: COMPOSER_SYSTEM_PROMPT,
};

export interface ComposerInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  storyboard: Storyboard;
  previous?: ScorePlan;
}

export async function invokeComposer(
  cfg: TextProviderConfig,
  input: ComposerInput,
): Promise<ScorePlan> {
  const agent = new Agent({
    id: composerSpec.id,
    description: composerSpec.description,
    systemPrompt: composerSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.85 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    input.previous ? `\nPREVIOUS SCORE PLAN:\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a ScorePlan.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: ScorePlanSchema,
  });
  return ScorePlanSchema.parse(result.structuredOutput);
}
