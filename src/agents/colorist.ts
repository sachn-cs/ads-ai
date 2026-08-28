import { ColorGradeDirectionSchema, type ColorGradeDirection } from '@/src/models';
import { COLORIST_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
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
  const { output } = await invokeStructuredAgent<ColorGradeDirection>({
    agentId: 'colorist',
    cfg: { ...cfg, temperature: 0.6 },
    systemPrompt: COLORIST_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: ColorGradeDirectionSchema,
    temperature: 0.6,
  });
  return output;
}