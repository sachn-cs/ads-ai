import { Agent } from '@strands-agents/sdk';
import { ColorGradeDirectionSchema, type ColorGradeDirection } from '@/src/models';
import { COLORIST_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type {
  CinestudioBrief,
  CompositeQualityReport,
  ScriptBreakdown,
  Storyboard,
} from '@/src/models';

export const coloristSpec = {
  id: 'colorist',
  description:
    'Colorist / DP. Designs a three-act LUT arc (opening -> climax -> resolution) with per-scene overrides.',
  systemPrompt: COLORIST_SYSTEM_PROMPT,
};

export interface ColoristInput {
  brief: CinestudioBrief;
  storyboard: Storyboard;
  script: ScriptBreakdown;
  composite?: CompositeQualityReport;
}

export async function invokeColorist(
  cfg: TextProviderConfig,
  input: ColoristInput,
): Promise<ColorGradeDirection> {
  const agent = new Agent({
    id: coloristSpec.id,
    description: coloristSpec.description,
    systemPrompt: coloristSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.6 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    input.composite ? `\nCOMPOSITE QUALITY REPORT:\n${JSON.stringify(input.composite, null, 2)}\n` : '',
    '\nProduce a ColorGradeDirection.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: ColorGradeDirectionSchema,
  });
  return ColorGradeDirectionSchema.parse(result.structuredOutput);
}
