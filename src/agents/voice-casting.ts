import { Agent } from '@strands-agents/sdk';
import {
  VoiceCastSchema,
  type VoiceCast,
  type CharacterCast,
  type ScriptBreakdown,
  type ScorePlan,
  type SoundDesignPlan,
} from '@/src/models';
import { VOICE_CASTING_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import { synthesizeWithMiniMaxSpeech, saveMiniMaxAudio } from '@/src/providers/minimax/speech';
import { getDb } from '@/src/db/client';
import { insertMultimodalAsset } from '@/src/db/multimodal-assets';
import { logger } from '@/src/lib/logger';
import path from 'node:path';
import type { CinestudioConfig } from '@/src/types';

const log = logger('agents/voice-casting');

export const voiceCastingSpec = {
  id: 'voice_casting',
  description:
    'Voice casting. Maps characters to voices + dialogue coverage. When multimodal speech is enabled, also generates a sample voice line per character and persists it to multimodal_assets.',
  systemPrompt: VOICE_CASTING_SYSTEM_PROMPT,
};

export interface VoiceCastingInput {
  cast: CharacterCast;
  script: ScriptBreakdown;
  scorePlan: ScorePlan;
  soundPlan: SoundDesignPlan;
  previous?: VoiceCast;
}

const DEFAULT_VOICE_BY_CHARACTER: Record<string, string> = {
  protagonist: 'English_expressive_narrator',
  antagonist: 'English_Persuasive_Man',
  narrator: 'English_radiant_girl',
  mentor: 'English_Insightful_Speaker',
};

export async function invokeVoiceCasting(
  cfg: CinestudioConfig,
  input: VoiceCastingInput,
  runId?: string,
): Promise<VoiceCast> {
  const agent = new Agent({
    id: voiceCastingSpec.id,
    description: voiceCastingSpec.description,
    systemPrompt: VOICE_CASTING_SYSTEM_PROMPT,
    model: buildModel({ ...cfg.textProvider, temperature: 0.5 }),
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
    input.previous ? `\nPREVIOUS VOICE CAST:\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a VoiceCast.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: VoiceCastSchema,
  });
  const cast = VoiceCastSchema.parse(result.structuredOutput);

  if (runId && cfg.multimodal.speech.enabled && cfg.multimodal.speech.apiKey) {
    const speechCfg = {
      apiKey: cfg.multimodal.speech.apiKey,
      model: cfg.multimodal.speech.model,
      baseUrl: cfg.multimodal.speech.baseUrl,
      artifactDir: path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'),
    };
    const db = getDb();
    for (const character of input.cast.characters) {
      const voiceId =
        cast.castingNotes[character.id]?.voiceId ??
        DEFAULT_VOICE_BY_CHARACTER[character.role] ??
        'English_expressive_narrator';
      try {
        const sampleLine =
          (input.script.scenes
            .flatMap((s) => s.dialogue.filter((d) => d.characterId === character.id))
            .find(() => true)?.line) ?? `I am ${character.name}, and this is my voice.`;
        const r = await synthesizeWithMiniMaxSpeech(speechCfg, {
          artifactId: `voice-${character.id}`,
          text: sampleLine,
          voiceId,
        });
        const dl = await saveMiniMaxAudio(speechCfg, r.audioBase64, `voice-${character.id}`);
        insertMultimodalAsset(db, {
          runId,
          agentId: 'voice_casting',
          kind: 'voice_line',
          artifactId: character.id,
          storagePath: dl.path,
          contentType: 'audio/mpeg',
          durationSeconds: r.durationMs ? r.durationMs / 1000 : undefined,
          sizeBytes: dl.bytes,
          provider: 'minimax',
          model: speechCfg.model ?? 'speech-2.8-hd',
          metadata: { voiceId, characterId: character.id },
        });
      } catch (err) {
        log.warn('voice_line_skipped', { characterId: character.id, err: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return cast;
}

// (VoiceCastingInput exported via the export type at top of file)

