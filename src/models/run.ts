import { z } from 'zod';

export const RunEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  ts: z.string(),
  type: z.enum([
    'run_started',
    'agent_started',
    'agent_message',
    'agent_completed',
    'agent_failed',
    'render_started',
    'render_progress',
    'render_completed',
    'render_failed',
    'iteration_started',
    'iteration_completed',
    'checkpoint_written',
    'tool_called',
    'run_completed',
    'run_failed',
  ]),
  agentId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
});
export type RunEvent = z.infer<typeof RunEventSchema>;

export const RunSummarySchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'running', 'awaiting_review', 'completed', 'failed', 'cancelled']),
  prompt: z.string().describe('Original user brief / logline.'),
  totalShots: z.number().int(),
  totalRuntimeSeconds: z.number(),
  qualityScore: z.number().optional(),
  qualityDecision: z.enum(['GO', 'NO_GO', 'CONDITIONAL_GO']).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  artifactPaths: z.array(z.string()).default([]),
});
export type RunSummary = z.infer<typeof RunSummarySchema>;

export const FinalFilmSchema = z.object({
  id: z.string(),
  runId: z.string(),
  title: z.string(),
  logline: z.string(),
  totalRuntimeSeconds: z.number(),
  masterVideoPath: z.string().optional(),
  sceneBreakdown: z.array(
    z.object({
      sceneNumber: z.number().int(),
      slugline: z.string(),
      startSeconds: z.number(),
      endSeconds: z.number(),
    }),
  ),
  credits: z.array(z.object({ role: z.string(), agentId: z.string() })),
  qualityReport: z.object({
    overallScore: z.number(),
    decision: z.enum(['GO', 'NO_GO', 'CONDITIONAL_GO']),
  }),
  generatedAt: z.string(),
});
export type FinalFilm = z.infer<typeof FinalFilmSchema>;

export const ProviderAuthSchema = z.object({
  provider: z.enum(['bedrock', 'anthropic', 'openai', 'google', 'ollama', 'minimax']),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  region: z.string().optional(),
  model: z.string(),
  enabled: z.boolean(),
});
export type ProviderAuth = z.infer<typeof ProviderAuthSchema>;
