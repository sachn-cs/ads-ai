import { Agent } from '@strands-agents/sdk';
import { CharacterCastSchema, type CharacterCast } from '@/src/models';
import { CHARACTER_DESIGNER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief, ScriptBreakdown } from '@/src/models';

export const characterDesignerSpec = {
  id: 'character_designer',
  description:
    'Character designer. Casts roles, defines personalities, visual hooks, and reference seeds for cross-shot consistency.',
  systemPrompt: CHARACTER_DESIGNER_SYSTEM_PROMPT,
};

export interface CharacterDesignerInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  previous?: CharacterCast;
}

export async function invokeCharacterDesigner(
  cfg: TextProviderConfig,
  input: CharacterDesignerInput,
): Promise<CharacterCast> {
  const agent = new Agent({
    id: characterDesignerSpec.id,
    description: characterDesignerSpec.description,
    systemPrompt: characterDesignerSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.75 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    input.previous ? `\nPREVIOUS CAST (preserve references where possible):\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a CharacterCast. Reference seeds must NEVER describe real people.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: CharacterCastSchema,
  });
  return CharacterCastSchema.parse(result.structuredOutput);
}
