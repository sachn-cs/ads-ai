import { Agent } from '@strands-agents/sdk';
import { StoryboardSchema, type Storyboard } from '@/src/models';
import { STORYBOARD_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief, ScriptBreakdown, CharacterCast, WorldDesign } from '@/src/models';

export const storyboardSpec = {
  id: 'storyboard',
  description:
    'Storyboard artist. Turns script + cast + world into shot-by-shot coverage with batching hints.',
  systemPrompt: STORYBOARD_SYSTEM_PROMPT,
};

export interface StoryboardInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  cast: CharacterCast;
  world: WorldDesign;
  previous?: Storyboard;
  iterationDirective?: string;
}

export async function invokeStoryboard(
  cfg: TextProviderConfig,
  input: StoryboardInput,
): Promise<Storyboard> {
  const agent = new Agent({
    id: storyboardSpec.id,
    description: storyboardSpec.description,
    systemPrompt: storyboardSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.8 }),
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
    input.previous ? `\nPREVIOUS STORYBOARD:\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    input.iterationDirective ? `\nITERATION DIRECTIVE:\n${input.iterationDirective}\n` : '',
    '\nProduce a Storyboard. Pre-compute render batches so the dispatcher can fan out economically.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: StoryboardSchema,
  });
  return StoryboardSchema.parse(result.structuredOutput);
}
