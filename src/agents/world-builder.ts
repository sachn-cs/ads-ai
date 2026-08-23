import { Agent } from '@strands-agents/sdk';
import { WorldDesignSchema, type WorldDesign } from '@/src/models';
import { WORLD_BUILDER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
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
  const agent = new Agent({
    id: worldBuilderSpec.id,
    description: worldBuilderSpec.description,
    systemPrompt: worldBuilderSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.7 }),
    printer: false,
  });
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
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: WorldDesignSchema,
  });
  return WorldDesignSchema.parse(result.structuredOutput);
}
