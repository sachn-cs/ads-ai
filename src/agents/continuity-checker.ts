import { z } from 'zod';
import type { TextProviderConfig } from '@/src/types';
import { CONTINUITY_CHECKER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import type {
  CharacterCast,
  ScriptBreakdown,
  ShotRenderResult,
  WorldDesign,
} from '@/src/models';

export const continuityCheckerSpec = {
  id: 'continuity_checker',
  description:
    'Continuity checker. Audits continuity across rendered shots and reports violations.',
  systemPrompt: CONTINUITY_CHECKER_SYSTEM_PROMPT,
};

export const ContinuityIssueSchema = z.object({
  shotId: z.string(),
  kind: z.enum(['wardrobe', 'object', 'spatial', 'emotional', 'temporal', 'palette', 'character', 'location', 'prop', 'beat']).optional(),
  dimension: z.enum(['palette', 'continuity', 'character', 'location', 'prop', 'beat']).optional(),
  severity: z.enum(['info', 'warning', 'blocker', 'warn', 'error']),
  message: z.string().min(10).optional(),
  description: z.string().min(20).optional(),
  suggestedFix: z.string().min(10).optional(),
}).transform((v) => ({
  shotId: v.shotId,
  kind: (v.kind ?? (v.dimension as unknown as 'wardrobe' | 'object' | 'spatial' | 'emotional' | 'temporal' | 'palette' | 'character' | 'location' | 'prop' | 'beat') ?? 'beat') as 'wardrobe' | 'object' | 'spatial' | 'emotional' | 'temporal',
  severity: v.severity === 'warning' ? 'warn' : v.severity === 'blocker' ? 'error' : v.severity === 'warn' ? 'warn' : v.severity === 'error' ? 'error' : 'info',
  message: v.message ?? v.description ?? '',
}));
export type ContinuityIssue = z.infer<typeof ContinuityIssueSchema>;

export const ContinuityIssuesSchema = z.array(ContinuityIssueSchema);

export interface ContinuityCheckerInput {
  shots: ShotRenderResult[];
  cast: CharacterCast;
  world: WorldDesign;
  script: ScriptBreakdown;
}

export async function invokeContinuityChecker(
  cfg: TextProviderConfig,
  input: ContinuityCheckerInput,
): Promise<ContinuityIssue[]> {
  const prompt = [
    'RENDERED SHOTS:',
    JSON.stringify(input.shots, null, 2),
    '\nCHARACTER CAST:',
    JSON.stringify(input.cast, null, 2),
    '\nWORLD DESIGN:',
    JSON.stringify(input.world, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nReturn ALL continuity issues you find. Be exhaustive; do not omit.',
  ].join('\n');
  const { output } = await invokeStructuredAgent<ContinuityIssue[]>({
    agentId: 'continuity_checker',
    cfg: { ...cfg, temperature: 0.4 },
    systemPrompt: CONTINUITY_CHECKER_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: ContinuityIssuesSchema,
    temperature: 0.4,
  });
  return output;
}