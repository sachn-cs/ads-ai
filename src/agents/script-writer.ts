import { ScriptBreakdownSchema, type ScriptBreakdown } from '@/src/models';
import { SCRIPT_WRITER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
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
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    input.previous
      ? `\nPREVIOUS SCRIPT (for reference / continuity):\n${JSON.stringify(input.previous, null, 2)}\n`
      : '',
    input.iterationDirective ? `\nITERATION DIRECTIVE:\n${input.iterationDirective}\n` : '',
    '\nIMPORTANT: target scene count = MAX 4 scenes for this short film. ' +
      'Each scene should be 8-15 seconds. Keep dialogue + voiceover to 1-2 lines max. ' +
      'Compress beats aggressively; do NOT produce per-character beats for every scene. ' +
      'NEVER leave a scene half-finished — better 3 complete scenes than 4 with the last one truncated.',
    '\nProduce a ScriptBreakdown that respects the brief and (if provided) integrates the iteration directive.',
  ].join('\n');
  const { output } = await invokeStructuredAgent<ScriptBreakdown>({
    agentId: 'script_writer',
    cfg: { ...cfg, temperature: 0.9, maxTokens: 16384 },
    systemPrompt: SCRIPT_WRITER_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: ScriptBreakdownSchema,
    temperature: 0.9,
  });
  return output;
}