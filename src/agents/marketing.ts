import {
  MarketingAssetSchema,
  type MarketingAsset,
  type CinestudioBrief,
  type AssemblyPlan,
  type VoiceCast,
  type RightsReport,
  type ScorePlan,
  type DistributionPackage,
} from '@/src/models';
import { MARKETING_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeMiniMaxAnthropic } from '@/src/providers/minimax/text';
import type { TextProviderConfig } from '@/src/types';
import { ulid } from '@/src/lib/id';
import { logger } from '@/src/lib/logger';

const log = logger('agents/marketing');

export const marketingSpec = {
  id: 'marketing',
  description: 'Generates social cutdown specs, thumbnail concepts, press blurb, and hashtags from a finished film.',
};

export interface MarketingInput {
  brief: CinestudioBrief;
  assembly: AssemblyPlan;
  voiceCast: VoiceCast;
  rightsReport: RightsReport;
  scorePlan: ScorePlan;
  distribution?: DistributionPackage;
}

export async function invokeMarketing(
  cfg: TextProviderConfig,
  input: MarketingInput,
): Promise<MarketingAsset> {
  log.info('marketing_invoking', { briefId: input.brief.id });
  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: cfg.apiKey ?? '',
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      temperature: cfg.temperature ?? 0.7,
      maxTokens: cfg.maxTokens ?? 8192,
    },
    {
      system: MARKETING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            `CINESTUDIO BRIEF:\n${JSON.stringify(input.brief, null, 2)}\n\n` +
            `ASSEMBLY PLAN:\n${JSON.stringify(input.assembly, null, 2)}\n\n` +
            `VOICE CAST:\n${JSON.stringify(input.voiceCast, null, 2)}\n\n` +
            `SCORE PLAN:\n${JSON.stringify(input.scorePlan, null, 2)}\n\n` +
            `RIGHTS REPORT:\n${JSON.stringify(input.rightsReport, null, 2)}\n\n` +
            `Produce the MarketingAsset JSON.`,
        },
      ],
    },
  );
  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Marketing produced unparseable output');
  const raw = JSON.parse(jsonMatch[0]);
  return MarketingAssetSchema.parse({
    ...raw,
    id: raw.id ?? ulid(),
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
  });
}
