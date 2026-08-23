import { Agent } from '@strands-agents/sdk';
import { z } from 'zod';
import type { TextProviderConfig } from '@/src/types';
import { buildModel } from '@/src/providers/factory';
import { CONTINUITY_CHECKER_SYSTEM_PROMPT } from '@/src/prompts';
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
  const agent = new Agent({
    id: continuityCheckerSpec.id,
    description: continuityCheckerSpec.description,
    systemPrompt: continuityCheckerSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.4 }),
    printer: false,
  });
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
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: ContinuityIssuesSchema,
  });
  return ContinuityIssuesSchema.parse(result.structuredOutput);
}
