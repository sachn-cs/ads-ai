import { Agent } from '@strands-agents/sdk';
import { VoiceCastSchema, type VoiceCast } from '@/src/models';
import { VOICE_CASTING_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type {
  CharacterCast,
  ScriptBreakdown,
  ScorePlan,
  SoundDesignPlan,
} from '@/src/models';

export const voiceCastingSpec = {
  id: 'voice_casting',
  description:
    'Voice casting director. Maps characters to voice direction and dialogue coverage.',
  systemPrompt: VOICE_CASTING_SYSTEM_PROMPT,
};

export interface VoiceCastingInput {
  cast: CharacterCast;
  script: ScriptBreakdown;
  scorePlan: ScorePlan;
  soundPlan: SoundDesignPlan;
}

export async function invokeVoiceCasting(
  cfg: TextProviderConfig,
  input: VoiceCastingInput,
): Promise<VoiceCast> {
  const agent = new Agent({
    id: voiceCastingSpec.id,
    description: voiceCastingSpec.description,
    systemPrompt: voiceCastingSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.5 }),
    printer: false,
  });
  const prompt = [
    'CHARACTER CAST:',
    JSON.stringify(input.cast, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nSCORE PLAN:',
    JSON.stringify(input.scorePlan, null, 2),
    '\nSOUND PLAN:',
    JSON.stringify(input.soundPlan, null, 2),
    '\nProduce a VoiceCast.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: VoiceCastSchema,
  });
  return VoiceCastSchema.parse(result.structuredOutput);
}
