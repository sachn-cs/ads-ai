import { AssemblyPlanSchema, type AssemblyPlan } from '@/src/models';
import { EDITOR_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type {
  ScriptBreakdown,
  ShotRenderResult,
  Storyboard,
  ScorePlan,
} from '@/src/models';

export const editorSpec = {
  id: 'editor',
  description:
    'Editor. Assembles rendered shots into an AssemblyPlan with cuts, transitions, and pacing.',
  systemPrompt: EDITOR_SYSTEM_PROMPT,
};

export interface EditorInput {
  script: ScriptBreakdown;
  shots: ShotRenderResult[];
  storyboard: Storyboard;
  scorePlan?: ScorePlan;
}

export async function invokeEditor(
  cfg: TextProviderConfig,
  input: EditorInput,
): Promise<AssemblyPlan> {
  const prompt = [
    'SCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nRENDERED SHOTS:',
    JSON.stringify(input.shots, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    input.scorePlan ? `\nSCORE PLAN:\n${JSON.stringify(input.scorePlan, null, 2)}\n` : '',
    '\nProduce an AssemblyPlan.',
  ].join('\n');
  const { output } = await invokeStructuredAgent<AssemblyPlan>({
    agentId: 'editor',
    cfg: { ...cfg, temperature: 0.4 },
    systemPrompt: EDITOR_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: AssemblyPlanSchema,
    temperature: 0.4,
  });
  return output;
}