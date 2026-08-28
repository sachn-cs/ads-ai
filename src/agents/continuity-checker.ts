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
  dimension: z.enum(['continuity', 'character', 'location', 'prop', 'palette', 'beat']),
  severity: z.enum(['info', 'warning', 'blocker']),
  description: z.string(),
  suggestedFix: z.string(),
});
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