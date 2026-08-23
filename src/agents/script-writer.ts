import { Agent } from '@strands-agents/sdk';
import { ScriptBreakdownSchema, type ScriptBreakdown } from '@/src/models';
import { SCRIPT_WRITER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief } from '@/src/models';

export const scriptWriterSpec = {
  id: 'script_writer',
  description:
    'Screenwriter. Turns a CinestudioBrief into a structured ScriptBreakdown with scenes, dialogue, and beat maps.',
  systemPrompt: SCRIPT_WRITER_SYSTEM_PROMPT,
};

export interface ScriptWriterInput {
  brief: CinestudioBrief;
  previous?: ScriptBreakdown;
  iterationDirective?: string;
}

export async function invokeScriptWriter(
  cfg: TextProviderConfig,
  input: ScriptWriterInput,
): Promise<ScriptBreakdown> {
  const agent = new Agent({
    id: scriptWriterSpec.id,
    description: scriptWriterSpec.description,
    systemPrompt: scriptWriterSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.9 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    input.previous
      ? `\nPREVIOUS SCRIPT (for reference / continuity):\n${JSON.stringify(input.previous, null, 2)}\n`
      : '',
    input.iterationDirective ? `\nITERATION DIRECTIVE:\n${input.iterationDirective}\n` : '',
    '\nProduce a ScriptBreakdown that respects the brief and (if provided) integrates the iteration directive.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: ScriptBreakdownSchema,
  });
  return ScriptBreakdownSchema.parse(result.structuredOutput);
}
