import { z } from 'zod';

export const VoiceCastSchema = z.object({
  id: z.string(),
  castingNotes: z.record(
    z.string(),
    z.object({
      voiceTone: z.string(),
      directionHint: z.string(),
      referencePerformances: z.array(z.string()).optional(),
    }),
  ).describe('Map characterId -> casting notes.'),
  dialogueCoverage: z.array(
    z.object({
      characterId: z.string(),
      sceneNumbers: z.array(z.number().int()),
      lineCount: z.number().int(),
      estimatedDurationSeconds: z.number(),
    }),
  ),
  narrationPlan: z.object({
    voiceId: z.string().optional(),
    delivery: z.string(),
    sampleLines: z.array(z.string()),
  }).optional(),
  utilityVoices: z.array(z.string()).optional().describe('Background / witness voices.'),
});
export type VoiceCast = z.infer<typeof VoiceCastSchema>;

export const DistributionPackageSchema = z.object({
  id: z.string(),
  exports: z.array(
    z.object({
      label: z.string().describe('e.g. "YouTube 1080p H.264", "Festival ProRes 422 HQ".'),
      container: z.enum(['mp4', 'mov', 'webm', 'mkv']),
      codec: z.string().describe('e.g. "h264", "prores_422", "av1".'),
      resolution: z.enum(['480p', '720p', '1080p', '4k']),
      aspectRatio: z.enum(['16:9', '9:16', '1:1', '21:9', '4:3']),
      frameRate: z.union([z.literal(23.976), z.literal(24), z.literal(25), z.literal(29.97), z.literal(30), z.literal(48), z.literal(60)]),
      audioChannels: z.enum(['mono', 'stereo', '5.1']),
      audioLufsTarget: z.number(),
      captionTracks: z.array(
        z.object({
          language: z.string(),
          format: z.enum(['srt', 'vtt', 'ttml']),
        }),
      ).default([]),
      maxBitrateKbps: z.number().optional(),
    }),
  ),
  metadata: z.object({
    title: z.string(),
    synopsis: z.string().max(1000),
    tags: z.array(z.string()),
    contentWarnings: z.array(z.string()).default([]),
    credits: z.array(
      z.object({
        role: z.string(),
        name: z.string(),
      }),
    ),
  }),
  festivalApplications: z
    .array(
      z.object({
        festival: z.string(),
        category: z.string(),
        submissionDeadline: z.string(),
        feeUsd: z.number().optional(),
        notes: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});
export type DistributionPackage = z.infer<typeof DistributionPackageSchema>;
