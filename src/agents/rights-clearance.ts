import { Agent } from '@strands-agents/sdk';
import { RightsReportSchema, type RightsReport } from '@/src/models';
import { RIGHTS_CLEARANCE_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type {
  CinestudioBrief,
  CharacterCast,
  DistributionPackage,
  ScriptBreakdown,
  WorldDesign,
} from '@/src/models';
import type { ContinuityIssue } from './continuity-checker';

export const rightsClearanceSpec = {
  id: 'rights_clearance',
  description:
    'Rights / compliance officer. Produces a RightsReport flagging likeness, trademark, copyright, language, and platform risks.',
  systemPrompt: RIGHTS_CLEARANCE_SYSTEM_PROMPT,
};

export interface RightsClearanceInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  cast: CharacterCast;
  world: WorldDesign;
  distribution: DistributionPackage;
  continuityIssues: ContinuityIssue[];
}

export async function invokeRightsClearance(
  cfg: TextProviderConfig,
  input: RightsClearanceInput,
): Promise<RightsReport> {
  const agent = new Agent({
    id: rightsClearanceSpec.id,
    description: rightsClearanceSpec.description,
    systemPrompt: rightsClearanceSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.2 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nCHARACTER CAST (verifies reference seeds are non-real-persons):',
    JSON.stringify(input.cast, null, 2),
    '\nWORLD DESIGN (any public-location issues?):',
    JSON.stringify(input.world, null, 2),
    '\nDISTRIBUTION PACKAGE (target platform constraints):',
    JSON.stringify(input.distribution, null, 2),
    '\nCONTINUITY ISSUES (some may be compliance-relevant):',
    JSON.stringify(input.continuityIssues, null, 2),
    '\nProduce a RightsReport. Blockers must have severity=blocker.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: RightsReportSchema,
  });
  return RightsReportSchema.parse(result.structuredOutput);
}
