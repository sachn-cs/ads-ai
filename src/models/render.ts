import { z } from 'zod';
import { RenderProviderEnum } from './common';

export const VideoAspectRatioEnum = z.enum([
  'adaptive',
  '21:9',
  '16:9',
  '4:3',
  '1:1',
  '3:4',
  '9:16',
]);
export type VideoAspectRatio = z.infer<typeof VideoAspectRatioEnum>;

const MediaAttachmentSchema = z
  .object({
    url: z.string().optional().describe('Public URL or data URI.'),
    fileId: z.string().optional().describe('MiniMax file_id (will be wrapped as mm_file://).'),
    bytes: z.instanceof(Uint8Array).optional().describe('Local bytes; uploaded before dispatch.'),
    filename: z.string().optional(),
    contentType: z.string().optional(),
  })
  .refine(
    (v) => Boolean(v.url || v.fileId || (v.bytes && v.filename)),
    'attachment requires url, fileId, or bytes+filename',
  );

export const ShotRenderInstructionSchema = z.object({
  shotId: z.string().describe('Matches StoryboardShot.shotId.'),
  provider: RenderProviderEnum.describe('Resolved provider (overrides any hint).'),
  model: z.string().describe('Specific model for the provider, e.g. "veo-3.1".'),
  prompt: z
    .string()
    .min(50)
    .describe('Cinematic prompt: visual only, no dialogue. Single flowing paragraph.'),
  negativePrompt: z.string().default('').describe('What to suppress (e.g. "no text, no subtitles").'),
  seed: z.number().int().optional().describe('Optional deterministic seed.'),
  aspectRatio: VideoAspectRatioEnum,
  cameraSpec: z.object({
    move: z.string().describe('Camera move (orbit / dolly / static).'),
    lensMm: z.number().int(),
    aperture: z.string().optional(),
    shutterDeg: z.number().int().optional(),
  }),
  lightingSpec: z.object({
    palette: z.array(z.string()),
    keyDirection: z.string(),
    atmosphere: z.string().describe('Fog, dust, rain, etc.'),
    exposureMood: z.enum(['low_key', 'mid_key', 'high_key']),
  }),
  durationSeconds: z.number().min(2).max(20),
  resolution: z.enum(['768P', '2K']).optional(),
  referenceImageHint: z
    .string()
    .optional()
    .describe('Short description of the character/location reference image to attach.'),
  contextAttachments: z
    .array(z.string())
    .optional()
    .describe('Reference ids — character reference, location reference, prior shot.'),
  firstFrame: MediaAttachmentSchema.optional()
    .describe('MiniMax i2va first_frame (mutually exclusive with reference_*).'),
  lastFrame: MediaAttachmentSchema.optional().describe('MiniMax i2va last_frame.'),
  referenceImages: z.array(MediaAttachmentSchema).optional(),
  referenceVideos: z.array(MediaAttachmentSchema).optional(),
  referenceAudios: z.array(MediaAttachmentSchema).optional(),
});
export type ShotRenderInstruction = z.infer<typeof ShotRenderInstructionSchema>;

export const RenderBatchPlanSchema = z.object({
  batchId: z.string(),
  provider: RenderProviderEnum,
  sharedPromptPrefix: z.string().describe('Shared style/character prefix for every shot in the batch.'),
  sharedNegativePrompt: z.string(),
  styleTag: z.string(),
  shots: z.array(ShotRenderInstructionSchema).min(1),
  estimatedCostUnits: z.number().describe('Provider-specific cost estimate.'),
  estimatedDurationSeconds: z.number(),
});
export type RenderBatchPlan = z.infer<typeof RenderBatchPlanSchema>;

export const ShotRenderResultSchema = z.object({
  shotId: z.string(),
  provider: RenderProviderEnum,
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  videoPath: z.string().optional(),
  stillPath: z.string().optional(),
  durationSeconds: z.number().optional(),
  modelUsed: z.string().optional(),
  costUnits: z.number().optional(),
  errorMessage: z.string().optional(),
  attempts: z.number().int().default(0),
  completedAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type ShotRenderResult = z.infer<typeof ShotRenderResultSchema>;
