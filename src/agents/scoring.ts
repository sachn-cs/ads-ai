import { CompositeQualityReportSchema, type CompositeQualityReport } from '@/src/models';
import { SCORING_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
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
  const prompt = [
    `Cycle ${input.cycleNumber}. Passing threshold ${input.passingThreshold}.`,
    '\nCRITIQUE REPORT:',
    JSON.stringify(input.critique, null, 2),
    '\nProduce a CompositeQualityReport.',
  ].join('\n');
  const { output } = await invokeStructuredAgent<CompositeQualityReport>({
    agentId: 'scoring',
    cfg: { ...cfg, temperature: 0.3 },
    systemPrompt: SCORING_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: CompositeQualityReportSchema,
    temperature: 0.3,
  });
  return output;
}