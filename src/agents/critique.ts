import { CritiqueReportSchema, type CritiqueReport } from '@/src/models';
import { CRITIQUE_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type {
  CinestudioBrief,
  CharacterCast,
  ScriptBreakdown,
  ShotRenderResult,
  WorldDesign,
} from '@/src/models';
import type { ContinuityIssue } from './continuity-checker';

export const critiqueSpec = {
  id: 'critique',
  description:
    'Critique agent. Scores every rendered shot across 10 dimensions, decides GO/NO_GO, and proposes surgical fixes.',
  systemPrompt: CRITIQUE_SYSTEM_PROMPT,
};

export interface CritiqueInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  cast: CharacterCast;
  world: WorldDesign;
  shots: ShotRenderResult[];
  continuityIssues: ContinuityIssue[];
  previousCritique?: CritiqueReport;
  previousDirectives?: string[];
}

export async function invokeCritique(
  cfg: TextProviderConfig,
  input: CritiqueInput,
): Promise<CritiqueReport> {
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nCHARACTER CAST:',
    JSON.stringify(input.cast, null, 2),
    '\nWORLD DESIGN:',
    JSON.stringify(input.world, null, 2),
    '\nRENDERED SHOTS:',
    JSON.stringify(input.shots, null, 2),
    '\nCONTINUITY ISSUES:',
    JSON.stringify(input.continuityIssues, null, 2),
    input.previousCritique ? `\nPREVIOUS CRITIQUE:\n${JSON.stringify(input.previousCritique, null, 2)}\n` : '',
    input.previousDirectives?.length
      ? `\nPREVIOUS ITERATION DIRECTIVES (verify they were applied):\n${input.previousDirectives.map((d, i) => `[${i + 1}] ${d}`).join('\n')}\n`
      : '',
    '\nProduce a CritiqueReport with at minimum: perShot[i].overallScore, decision, recommendedFixes.',
  ].join('\n');
  const { output } = await invokeStructuredAgent<CritiqueReport>({
    agentId: 'critique',
    cfg: { ...cfg, temperature: 0.55 },
    systemPrompt: CRITIQUE_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: CritiqueReportSchema,
    temperature: 0.55,
  });
  return output;
}