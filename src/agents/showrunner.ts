import { CinestudioBriefSchema, type CinestudioBrief } from '@/src/models';
import { SHOWRUNNER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import { ulid } from '@/src/lib/id';

const VALID_ASPECT = new Set(['16:9', '9:16', '1:1', '21:9', '4:3']);
const VALID_DIST = new Set([
  'festival_short_film',
  'festival_feature',
  'youtube',
  'vimeo',
  'tiktok',
  'instagram_reels',
  'broadcast',
  'brand_owned',
]);

function normalizeBrief(raw: CinestudioBrief): CinestudioBrief {
  const va = raw.visualApproach as unknown;
  if (va && typeof va === 'object' && !Array.isArray(va)) {
    const obj = va as Record<string, unknown>;
    const ar = typeof obj.aspectRatio === 'string' && VALID_ASPECT.has(obj.aspectRatio) ? obj.aspectRatio : '16:9';
    const cl = typeof obj.contrastLevel === 'string' && ['low', 'medium', 'high'].includes(obj.contrastLevel)
      ? obj.contrastLevel
      : 'medium';
    const gr = typeof obj.grain === 'string' && ['none', 'subtle', 'heavy'].includes(obj.grain) ? obj.grain : 'subtle';
    raw.visualApproach = {
      primaryHues: Array.isArray(obj.primaryHues) ? obj.primaryHues.filter((h) => typeof h === 'string') : [],
      contrastLevel: cl as 'low' | 'medium' | 'high',
      aspectRatio: ar as '16:9' | '9:16' | '1:1' | '21:9',
      grain: gr as 'none' | 'subtle' | 'heavy',
    };
  }
  raw.distributionTargets = (raw.distributionTargets ?? []).filter((d) => VALID_DIST.has(d)) as CinestudioBrief['distributionTargets'];
  if (raw.distributionTargets.length === 0) {
    raw.distributionTargets = ['youtube'];
  }
  if (!raw.id) raw.id = ulid();
  if (!raw.producedAt) raw.producedAt = new Date().toISOString();
  return raw;
}

export const showrunnerSpec = {
  id: 'showrunner',
  description:
    'Senior creative producer. Translates user intent into a CinestudioBrief that constrains all downstream agents.',
  systemPrompt: SHOWRUNNER_SYSTEM_PROMPT,
};

export async function invokeShowrunner(
  cfg: TextProviderConfig,
  userInput: string,
): Promise<CinestudioBrief> {
  const { output } = await invokeStructuredAgent<CinestudioBrief>({
    agentId: 'showrunner',
    cfg,
    systemPrompt: SHOWRUNNER_SYSTEM_PROMPT,
    userPrompt: userInput,
    schema: CinestudioBriefSchema,
    temperature: 0.85,
  });
  return normalizeBrief(output);
}