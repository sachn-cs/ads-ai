import { Agent } from '@strands-agents/sdk';
import { CompositeQualityReportSchema, type CompositeQualityReport } from '@/src/models';
import { SCORING_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type { CritiqueReport } from '@/src/models';

export const scoringSpec = {
  id: 'scoring',
  description:
    'Composite quality scorer. Aggregates per-shot critiques into a single production-readiness signal.',
  systemPrompt: SCORING_SYSTEM_PROMPT,
};

export interface ScoringInput {
  critique: CritiqueReport;
  cycleNumber: number;
  passingThreshold: number;
}

export async function invokeScoring(
  cfg: TextProviderConfig,
  input: ScoringInput,
): Promise<CompositeQualityReport> {
  const agent = new Agent({
    id: scoringSpec.id,
    description: scoringSpec.description,
    systemPrompt: scoringSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.3 }),
    printer: false,
  });
  const prompt = [
    `Cycle ${input.cycleNumber}. Passing threshold ${input.passingThreshold}.`,
    '\nCRITIQUE REPORT:',
    JSON.stringify(input.critique, null, 2),
    '\nProduce a CompositeQualityReport.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: CompositeQualityReportSchema,
  });
  return CompositeQualityReportSchema.parse(result.structuredOutput);
}
