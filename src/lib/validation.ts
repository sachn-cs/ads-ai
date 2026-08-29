import { z } from 'zod';

export const ProviderIdSchema = z.enum([
  'bedrock',
  'anthropic',
  'openai',
  'google',
  'ollama',
  'minimax',
]);

export const TextProviderConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: ProviderIdSchema,
  model: z.string().min(1).max(200),
  apiKey: z.string().max(4096).optional(),
  baseUrl: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(1_000_000).optional(),
});

export const RenderProviderIdSchema = z.enum(['veo', 'sora', 'runway', 'minimax']);

export const RenderProviderConfigSchema = z.object({
  enabled: z.boolean().default(false),
  model: z.string().min(1).max(200),
  apiKey: z.string().max(4096).optional(),
  projectId: z.string().max(200).optional(),
  baseUrl: z.string().max(500).optional(),
  maxConcurrentShots: z.number().int().min(1).max(32).default(4),
});

export const MultimodalProviderConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.literal('minimax'),
  model: z.string().min(1).max(200),
  apiKey: z.string().max(4096).optional(),
  baseUrl: z.string().max(500).optional(),
});

export const CinestudioConfigSchema = z.object({
  version: z.string().min(1).max(50),
  textProvider: TextProviderConfigSchema,
  renderProviders: z.object({
    veo: RenderProviderConfigSchema,
    sora: RenderProviderConfigSchema,
    runway: RenderProviderConfigSchema,
    minimax: RenderProviderConfigSchema,
  }),
  multimodal: z.object({
    image: MultimodalProviderConfigSchema,
    speech: MultimodalProviderConfigSchema,
    music: MultimodalProviderConfigSchema,
  }),
  defaults: z.object({
    maxIterations: z.number().int().min(1).max(20),
    qualityThreshold: z.number().int().min(0).max(100),
    targetRuntimeSeconds: z.object({
      min: z.number().int().min(1).max(7200),
      max: z.number().int().min(1).max(7200),
    }),
    aspectRatio: z.enum(['16:9', '9:16', '1:1', '21:9']),
    enableVideoRender: z.boolean(),
    enableAudioScore: z.boolean(),
    ideaExpansionCount: z.number().int().min(1).max(5),
  }),
  updatedAt: z.string().optional(),
});

export const ProviderTestSchema = z.object({
  provider: z.enum(['minimax', 'bedrock', 'anthropic', 'openai', 'google', 'ollama']),
  apiKey: z.string().max(4096).optional(),
  baseUrl: z.string().max(500).optional(),
  model: z.string().min(1).max(200),
});

export const ConfigTestRequestSchema = z.object({
  providers: z.array(ProviderTestSchema).min(1).max(20),
  save: z.boolean().optional(),
  config: CinestudioConfigSchema.optional(),
});

export const PromptSchema = z.string().min(5).max(8192).trim();

export const CreateRunRequestSchema = z
  .object({
    prompt: PromptSchema.optional(),
    runId: z.string().min(1).max(64).optional(),
    brief: z.unknown().optional(),
    productionId: z.string().min(1).optional(),
  })
  .refine(
    (b) => Boolean(b.prompt) || Boolean(b.runId),
    { message: 'either prompt or runId required' },
  )
  .refine(
    (b) => Boolean(b.productionId),
    { message: 'productionId required' },
  );

export const IdeasExpandRequestSchema = z.object({
  prompt: PromptSchema,
  count: z.number().int().min(1).max(5).optional(),
});

export const SelectVariantRequestSchema = z.object({
  variantIndex: z.number().int().min(0).max(100),
});

export const CancelRunRequestSchema = z.object({}).optional();

export const MultimodalKindSchema = z.enum([
  'character_portrait',
  'storyboard_frame',
  'voice_line',
  'foley',
  'score_stem',
  'cutdown',
  'thumbnail',
]);

export const CreateMultimodalAssetRequestSchema = z.object({
  kind: MultimodalKindSchema,
  artifactId: z.string().min(1).max(200),
  prompt: z.string().min(1).max(4096),
  metadata: z.record(z.string(), z.unknown()).optional(),
  aspectRatio: z
    .enum(['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9'])
    .optional(),
  instrumental: z.boolean().optional(),
  voiceId: z.string().max(200).optional(),
});

export const LoginRequestSchema = z.object({
  token: z.string().min(1).max(4096),
});

export type ProviderTestInput = z.infer<typeof ProviderTestSchema>;
export type CinestudioConfigInput = z.infer<typeof CinestudioConfigSchema>;
export type CreateMultimodalAssetInput = z.infer<typeof CreateMultimodalAssetRequestSchema>;
