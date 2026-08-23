import { z } from 'zod';

export const ToneEnum = z.enum([
  'gritty',
  'uplifting',
  'dark',
  'whimsical',
  'epic',
  'intimate',
  'documentary',
  'satirical',
  'mysterious',
  'romantic',
  'suspenseful',
  'surreal',
]);
export type Tone = z.infer<typeof ToneEnum>;

export const AspectRatioEnum = z.enum(['16:9', '9:16', '1:1', '21:9', '4:3']);
export type AspectRatio = z.infer<typeof AspectRatioEnum>;

export const GenreEnum = z.enum([
  'narrative_short',
  'documentary',
  'music_video',
  'trailer',
  'experimental',
  'animation',
  'micro_drama',
  'product_film',
  'brand_film',
]);
export type Genre = z.infer<typeof GenreEnum>;

export const RenderProviderEnum = z.enum(['veo', 'sora', 'runway']);
export type RenderProvider = z.infer<typeof RenderProviderEnum>;

export const ShotTypeEnum = z.enum([
  'wide',
  'medium',
  'close_up',
  'extreme_close_up',
  'over_the_shoulder',
  'pov',
  'aerial',
  'insert',
  'cutaway',
  'establishing',
  'two_shot',
  'tracking',
]);
export type ShotType = z.infer<typeof ShotTypeEnum>;

export const CameraMoveEnum = z.enum([
  'static',
  'pan',
  'tilt',
  'dolly',
  'truck',
  'crane',
  'steadicam',
  'handheld',
  'push_in',
  'pull_out',
  'orbit',
  'whip_pan',
]);
export type CameraMove = z.infer<typeof CameraMoveEnum>;

export const QualityDecisionEnum = z.enum(['GO', 'NO_GO', 'CONDITIONAL_GO']);
export type QualityDecision = z.infer<typeof QualityDecisionEnum>;

export const RenderStatusEnum = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);
export type RenderStatus = z.infer<typeof RenderStatusEnum>;

export const RunStatusEnum = z.enum([
  'queued',
  'running',
  'awaiting_review',
  'completed',
  'failed',
  'cancelled',
]);
export type RunStatus = z.infer<typeof RunStatusEnum>;

export const EvaluationDimensionEnum = z.enum([
  'visual_clarity',
  'narrative_coherence',
  'pacing',
  'cinematography',
  'audio_quality',
  'continuity',
  'performance',
  'tone_alignment',
  'platform_fit',
  'shot_realism',
]);
export type EvaluationDimension = z.infer<typeof EvaluationDimensionEnum>;

export const CinematographyPaletteSchema = z.object({
  primaryHues: z.array(z.string()).describe('CSS hex colors or named hues (3-7 entries).'),
  contrastLevel: z.enum(['low', 'medium', 'high', 'extreme']),
  filmStock: z.string().optional().describe('Reference: Kodak Vision3 500T, ARRI Alexa X-OCN, B&W Tri-X, etc.'),
  aspectRatio: AspectRatioEnum,
  grain: z.enum(['none', 'subtle', 'pronounced', 'heavy']).optional(),
});
export type CinematographyPalette = z.infer<typeof CinematographyPaletteSchema>;
