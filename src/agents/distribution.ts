import { Agent } from '@strands-agents/sdk';
import { DistributionPackageSchema, type DistributionPackage } from '@/src/models';
import { DISTRIBUTION_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type {
  CinestudioBrief,
  CharacterCast,
  ScorePlan,
  SoundDesignPlan,
  VoiceCast,
  AssemblyPlan,
  RightsReport,
  CompositeQualityReport,
} from '@/src/models';

export const distributionSpec = {
  id: 'distribution',
  description:
    'Distribution planner. Produces a DistributionPackage: exports + festival submissions.',
  systemPrompt: DISTRIBUTION_SYSTEM_PROMPT,
};

export interface DistributionInput {
  brief: CinestudioBrief;
  cast: CharacterCast;
  assembly: AssemblyPlan;
  voiceCast: VoiceCast;
  soundPlan: SoundDesignPlan;
  scorePlan: ScorePlan;
  rights?: RightsReport;
  composite: CompositeQualityReport;
}

export async function invokeDistribution(
  cfg: TextProviderConfig,
  input: DistributionInput,
): Promise<DistributionPackage> {
  const agent = new Agent({
    id: distributionSpec.id,
    description: distributionSpec.description,
    systemPrompt: distributionSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.4 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nCHARACTER CAST (for credits):',
    JSON.stringify(input.cast, null, 2),
    '\nASSEMBLY PLAN (runtime totals):',
    JSON.stringify(input.assembly, null, 2),
    '\nVOICE CAST:',
    JSON.stringify(input.voiceCast, null, 2),
    '\nSOUND PLAN:',
    JSON.stringify(input.soundPlan, null, 2),
    '\nSCORE PLAN:',
    JSON.stringify(input.scorePlan, null, 2),
    input.rights ? `\nRIGHTS REPORT (must respect blockers):\n${JSON.stringify(input.rights, null, 2)}\n` : '',
    '\nCOMPOSITE QUALITY:',
    JSON.stringify(input.composite, null, 2),
    '\nProduce a DistributionPackage. Do not fabricate festival deadlines — leave fields empty if uncertain.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: DistributionPackageSchema,
  });
  return DistributionPackageSchema.parse(result.structuredOutput);
}
