import { z } from 'zod';
import { CinestudioBriefSchema, type CinestudioBrief } from '@/src/models';
import { SHOWRUNNER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeMiniMaxAnthropic } from '@/src/providers/minimax/text';
import type { TextProviderConfig } from '@/src/types';
import { ulid } from '@/src/lib/id';
import { logger } from '@/src/lib/logger';

const log = logger('agents/showrunner');

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

function coerce(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (/^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value);
    return value;
  }
  if (Array.isArray(value)) return value.map(coerce);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = coerce(v);
    return out;
  }
  return value;
}

function normalizeBrief(raw: CinestudioBrief): CinestudioBrief {
  const va = raw.visualApproach as unknown;
  if (va && typeof va === 'object' && !Array.isArray(va)) {
    const obj = va as Record<string, unknown>;
    const ar =
      typeof obj.aspectRatio === 'string' && VALID_ASPECT.has(obj.aspectRatio)
        ? obj.aspectRatio
        : '16:9';
    const cl =
      typeof obj.contrastLevel === 'string' &&
      ['low', 'medium', 'high'].includes(obj.contrastLevel)
        ? obj.contrastLevel
        : 'medium';
    const gr =
      typeof obj.grain === 'string' &&
      ['none', 'subtle', 'heavy'].includes(obj.grain)
        ? obj.grain
        : 'subtle';
    raw.visualApproach = {
      primaryHues: Array.isArray(obj.primaryHues)
        ? obj.primaryHues.filter((h): h is string => typeof h === 'string')
        : [],
      contrastLevel: cl as 'low' | 'medium' | 'high',
      aspectRatio: ar as '16:9' | '9:16' | '1:1' | '21:9',
      grain: gr as 'none' | 'subtle' | 'heavy',
    };
  }
  raw.tone = (raw.tone ?? []).filter((t) => typeof t === 'string') as CinestudioBrief['tone'];
  raw.distributionTargets = (raw.distributionTargets ?? []).filter((d) =>
    VALID_DIST.has(d),
  ) as CinestudioBrief['distributionTargets'];
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
  log.info('showrunner_invoking', { promptLength: userInput.length });
  const tool = {
    name: 'submit_brief',
    description: 'Submit the CinestudioBrief for this film.',
    input_schema: z.toJSONSchema(CinestudioBriefSchema, { target: 'openApi3' }) as Record<string, unknown>,
  };
  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: cfg.apiKey ?? '',
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      temperature: cfg.temperature ?? 0.85,
      maxTokens: cfg.maxTokens ?? 8192,
    },
    {
      system: SHOWRUNNER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userInput }],
      tools: [tool],
    },
  );

  const raw = result.raw as { content?: Array<{ type: string; name?: string; input?: unknown }> };
  const toolUse = raw.content?.find((b) => b.type === 'tool_use' && b.name === 'submit_brief') as
    | { input?: unknown }
    | undefined;

  let rawInput: unknown;
  if (toolUse?.input !== undefined) {
    rawInput = toolUse.input;
  } else {
    const m = result.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('showrunner produced unparseable output');
    rawInput = JSON.parse(m[0]);
  }

  const coerced = coerce(rawInput);
  const normalized = normalizeBrief(coerced as CinestudioBrief);
  return CinestudioBriefSchema.parse(normalized);
}