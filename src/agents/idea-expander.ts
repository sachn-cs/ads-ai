import { z } from 'zod';
import { IdeaExpansionResultSchema, type IdeaExpansionResult } from '@/src/models';
import { IDEA_EXPANDER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeMiniMaxAnthropic } from '@/src/providers/minimax/text';
import type { TextProviderConfig } from '@/src/types';
import { logger } from '@/src/lib/logger';
import { ulid } from '@/src/lib/id';

const log = logger('agents/idea-expander');

export const ideaExpanderSpec = {
  id: 'idea_expander',
  description: 'Expands a raw user prompt into 3 distinct CinestudioBrief candidates for the user to pick from.',
};

function briefShape() {
  return z.object({
    id: z.string().describe('Stable id for this brief (ULID).'),
    logline: z.string().min(20).max(500).describe('One-sentence story hook.'),
    synopsis: z.string().min(100).describe('A short paragraph expanding the logline.'),
    genre: z.string().describe('narrative_short | narrative_feature | documentary | commercial | music_video | experimental'),
    tone: z.array(z.string()).min(1).max(3).describe('1-3 mood keywords e.g. intimate, melancholic'),
    targetRuntimeSeconds: z.number().int().min(15).max(1200).describe('Target finished length in seconds.'),
    audience: z
      .object({
        who: z.string().describe('Demographic + psychographic profile.'),
        where: z.array(z.string()).describe('Where they discover and watch the piece.'),
        expectations: z.array(z.string()).describe('What they want from this kind of work.'),
      })
      .describe('Who we are making this for.'),
    creativeNorthStars: z
      .array(z.string())
      .min(2)
      .max(7)
      .describe('Artistic principles the production must honor.'),
    visualApproach: z
      .object({
        primaryHues: z.array(z.string()).describe('Hex colors or short color words.'),
        contrastLevel: z.enum(['low', 'medium', 'high']).describe('Lighting contrast.'),
        aspectRatio: z.enum(['16:9', '9:16', '1:1', '21:9']).describe('Final aspect.'),
        grain: z.enum(['none', 'subtle', 'heavy']).describe('Film grain.'),
      })
      .describe('Cinematographic palette.'),
    referenceFilms: z.array(z.string()).optional().describe('Films the creative direction references.'),
    avoidances: z.array(z.string()).describe('Things we explicitly will not do.'),
    mustHaves: z.array(z.string()).describe('Beat / moment / image the piece must contain.'),
    distributionTargets: z
      .array(
        z.enum([
          'festival_short_film',
          'festival_feature',
          'youtube',
          'vimeo',
          'tiktok',
          'instagram_reels',
          'broadcast',
          'brand_owned',
        ]),
      )
      .min(1),
    producedAt: z.string().describe('ISO-8601 timestamp.'),
  });
}

const variantShape = z.object({
  id: z.string(),
  index: z.number().int().min(0),
  rationale: z.string().min(20).max(800),
  brief: briefShape(),
  confidence: z.number().min(0).max(1),
});

const resultShape = z.object({
  variants: z.array(variantShape).length(3),
});

export async function invokeIdeaExpander(
  cfg: TextProviderConfig,
  userPrompt: string,
  count: number = 3,
): Promise<IdeaExpansionResult> {
  log.info('idea_expander_invoking', { promptLength: userPrompt.length, count });

  const tool = {
    name: 'submit_idea_variants',
    description: `Submit exactly ${count} distinct CinestudioBrief candidates produced from the user prompt.`,
    input_schema: z.toJSONSchema(resultShape, { target: 'openApi3' }) as Record<string, unknown>,
  };

  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: cfg.apiKey ?? '',
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      temperature: cfg.temperature ?? 0.7,
      maxTokens: cfg.maxTokens ?? 8192,
    },
    {
      system: IDEA_EXPANDER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `USER PROMPT:\n${userPrompt}\n\nProduce EXACTLY ${count} IdeaVariants. Each variant.brief must be a complete CinestudioBrief-shape. Call the submit_idea_variants tool with the result.`,
        },
      ],
      tools: [tool],
    },
  );

  let parsed: { variants: unknown[] };
  try {
    const raw = result.raw as { content?: Array<{ type: string; input?: unknown }> };
    const toolUse = raw.content?.find((b) => b.type === 'tool_use' && (b as { name?: string }).name === 'submit_idea_variants') as { input?: { variants?: unknown[] } } | undefined;
    if (!toolUse?.input?.variants) {
      throw new Error('LLM did not call submit_idea_variants');
    }
    parsed = { variants: toolUse.input.variants };
  } catch (err) {
    log.warn('tool_use_parse_failed_fallback_regex', { err: String(err) });
    const m = result.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('IdeaExpander produced unparseable output');
    const obj = JSON.parse(m[0]);
    parsed = { variants: Array.isArray(obj.variants) ? obj.variants : [] };
  }

  const now = new Date().toISOString();
  const VALID_ASPECT = new Set(['16:9', '9:16', '1:1', '21:9', '4:3']);
  const finalWrapped = {
    variants: parsed.variants.slice(0, 3).map((v, i) => {
      const va = v as Record<string, unknown>;
      const br = (va.brief as Record<string, unknown>) ?? {};
      const toneRaw = br.tone;
      const tone = Array.isArray(toneRaw) ? (toneRaw as string[]) : typeof toneRaw === 'string' ? [toneRaw] : [];
      const vaVis = br.visualApproach;
      let visualApproach: unknown;
      if (typeof vaVis === 'string') {
        visualApproach = vaVis;
      } else if (vaVis && typeof vaVis === 'object') {
        const obj = vaVis as Record<string, unknown>;
        const ar = typeof obj.aspectRatio === 'string' && VALID_ASPECT.has(obj.aspectRatio) ? obj.aspectRatio : '16:9';
        visualApproach = {
          primaryHues: Array.isArray(obj.primaryHues) ? obj.primaryHues.filter((h) => typeof h === 'string') : [],
          contrastLevel: ['low', 'medium', 'high'].includes(obj.contrastLevel as string) ? obj.contrastLevel : 'medium',
          aspectRatio: ar,
          grain: ['none', 'subtle', 'heavy'].includes(obj.grain as string) ? obj.grain : 'subtle',
        };
      } else {
        visualApproach = 'Cinematic natural-light palette.';
      }
      return {
        id: (va.id as string) ?? ulid(),
        index: typeof va.index === 'number' ? va.index : i,
        rationale: typeof va.rationale === 'string' ? va.rationale : 'A variant produced from the prompt.',
        brief: {
          ...br,
          id: (br.id as string) ?? ulid(),
          producedAt: typeof br.producedAt === 'string' ? br.producedAt : now,
          tone,
          visualApproach,
        },
        confidence: typeof va.confidence === 'number' ? va.confidence : 0.7,
      };
    }),
    modelUsed: cfg.model,
    generatedAt: now,
  };

  const validated = IdeaExpansionResultSchema.parse(finalWrapped);
  return {
    modelUsed: cfg.model,
    generatedAt: now,
    variants: validated.variants.map((v, i) => ({ ...v, id: v.id ?? ulid(), index: i })),
  };
}