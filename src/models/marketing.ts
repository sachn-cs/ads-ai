import { z } from 'zod';

export const MarketingCutdownSpecSchema = z.object({
  artifactId: z.string(),
  platform: z.enum(['youtube', 'tiktok', 'instagram_reels', 'youtube_shorts', 'x', 'festival_avi']),
  durationSeconds: z.number().int().min(5).max(180),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  hookSeconds: z
    .number()
    .min(0)
    .max(10)
    .describe('Seconds at the very front of the cutdown optimized for retention.'),
  structureOutline: z
    .array(z.string())
    .describe('Bullet beats in order; the editor can use these as the cut spec.'),
  captions: z.array(z.string()).describe('On-screen text per beat, if any.'),
  cta: z.string().describe('Call to action shown at the end.'),
});

export const MarketingThumbnailSchema = z.object({
  artifactId: z.string(),
  platform: z.enum(['youtube', 'instagram_reels', 'tiktok', 'x']),
  prompt: z.string().describe('Text-to-image prompt for thumbnail generation.'),
  headlineOverlay: z.string().max(40),
  paletteHints: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(4),
});

export const MarketingAssetSchema = z.object({
  id: z.string(),
  cutdowns: z.array(MarketingCutdownSpecSchema).min(1).max(8),
  thumbnails: z.array(MarketingThumbnailSchema).min(1).max(6),
  pressBlurb: z.string().max(1200).describe('One-paragraph marketing synopsis.'),
  hashtags: z.array(z.string()).max(30),
  generatedAt: z.string(),
});
export type MarketingAsset = z.infer<typeof MarketingAssetSchema>;
export type MarketingCutdownSpec = z.infer<typeof MarketingCutdownSpecSchema>;
export type MarketingThumbnail = z.infer<typeof MarketingThumbnailSchema>;
