import { Agent } from '@strands-agents/sdk';
import { AssemblyPlanSchema, type AssemblyPlan } from '@/src/models';
import { EDITOR_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
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
  scorePlan: ScorePlan;
}

export async function invokeEditor(
  cfg: TextProviderConfig,
  input: EditorInput,
): Promise<AssemblyPlan> {
  const agent = new Agent({
    id: editorSpec.id,
    description: editorSpec.description,
    systemPrompt: editorSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.4 }),
    printer: false,
  });
  const prompt = [
    'SCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nRENDERED SHOTS:',
    JSON.stringify(input.shots, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    '\nSCORE PLAN:',
    JSON.stringify(input.scorePlan, null, 2),
    '\nProduce an AssemblyPlan.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: AssemblyPlanSchema,
  });
  return AssemblyPlanSchema.parse(result.structuredOutput);
}
