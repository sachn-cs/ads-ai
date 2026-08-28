import { WorldDesignSchema, type WorldDesign } from '@/src/models';
import { WORLD_BUILDER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief, ScriptBreakdown, CharacterCast } from '@/src/models';

export const worldBuilderSpec = {
  id: 'world_builder',
  description:
    'World builder. Designs locations, palette, sound world, and recurring visual motifs.',
  systemPrompt: WORLD_BUILDER_SYSTEM_PROMPT,
};

export interface WorldBuilderInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  cast: CharacterCast;
  previous?: WorldDesign;
}

export async function invokeWorldBuilder(
  cfg: TextProviderConfig,
  input: WorldBuilderInput,
): Promise<WorldDesign> {
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nCHARACTER CAST:',
    JSON.stringify(input.cast, null, 2),
    input.previous ? `\nPREVIOUS WORLD (continuity):\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a WorldDesign with consistent palette + recurring motifs.',
  ].join('\n');
  const { output } = await invokeStructuredAgent<WorldDesign>({
    agentId: 'world_builder',
    cfg: { ...cfg, temperature: 0.7 },
    systemPrompt: WORLD_BUILDER_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: WorldDesignSchema,
    temperature: 0.7,
  });
  return output;
}