import { Agent } from '@strands-agents/sdk';
import {
  SoundDesignPlanSchema,
  type SoundDesignPlan,
  type CinestudioBrief,
  type ScriptBreakdown,
  type WorldDesign,
  type ScorePlan,
  type Storyboard,
} from '@/src/models';
import { SOUND_DESIGNER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import { synthesizeWithMiniMaxSpeech, saveMiniMaxAudio } from '@/src/providers/minimax/speech';
import { getDb } from '@/src/db/client';
import { insertMultimodalAsset } from '@/src/db/multimodal-assets';
import { logger } from '@/src/lib/logger';
import path from 'node:path';
import type { CinestudioConfig } from '@/src/types';

const log = logger('agents/sound-designer');

export const soundDesignerSpec = {
  id: 'sound_designer',
  description:
    'Sound designer. Plans ambient beds, foley, hard effects, and intentional silences. When multimodal speech is enabled, also generates ambient bed samples and foley per cue and persists them to multimodal_assets.',
  systemPrompt: SOUND_DESIGNER_SYSTEM_PROMPT,
};

export interface SoundDesignerInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  world: WorldDesign;
  scorePlan: ScorePlan;
  storyboard: Storyboard;
  previous?: SoundDesignPlan;
}

export async function invokeSoundDesigner(
  cfg: CinestudioConfig,
  input: SoundDesignerInput,
  runId?: string,
): Promise<SoundDesignPlan> {
  const agent = new Agent({
    id: soundDesignerSpec.id,
    description: soundDesignerSpec.description,
    systemPrompt: soundDesignerSpec.systemPrompt,
    model: buildModel({ ...cfg.textProvider, temperature: 0.6 }),
    printer: false,
  });
  const prompt = [
    'SCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nWORLD DESIGN:',
    JSON.stringify(input.world, null, 2),
    '\nSCORE PLAN:',
    JSON.stringify(input.scorePlan, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    input.previous ? `\nPREVIOUS SOUND PLAN:\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a SoundDesignPlan.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: SoundDesignPlanSchema,
  });
  const plan = SoundDesignPlanSchema.parse(result.structuredOutput);

  if (runId && cfg.multimodal.speech.enabled && cfg.multimodal.speech.apiKey) {
    const speechCfg = {
      apiKey: cfg.multimodal.speech.apiKey,
      model: cfg.multimodal.speech.model,
      baseUrl: cfg.multimodal.speech.baseUrl,
      artifactDir: path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'),
    };
    const db = getDb();
    for (const bed of plan.ambientBeds) {
      try {
        const r = await synthesizeWithMiniMaxSpeech(speechCfg, {
          artifactId: `bed-${bed.locationId}`,
          text: `${bed.signature.join(', ')}. ${bed.dynamicLayers.join(', ')}`,
        });
        const dl = await saveMiniMaxAudio(speechCfg, r.audioBase64, `bed-${bed.locationId}`);
        insertMultimodalAsset(db, {
          runId,
          agentId: 'sound_designer',
          kind: 'foley',
          artifactId: `bed-${bed.locationId}`,
          storagePath: dl.path,
          contentType: 'audio/mpeg',
          durationSeconds: r.durationMs ? r.durationMs / 1000 : undefined,
          sizeBytes: dl.bytes,
          provider: 'minimax',
          model: speechCfg.model ?? 'speech-2.8-hd',
          metadata: { kind: 'ambient_bed' },
        });
      } catch (err) {
        log.warn('ambient_bed_skipped', { locationId: bed.locationId, err: err instanceof Error ? err.message : String(err) });
      }
    }
    for (const cue of plan.foleyCues) {
      try {
        const r = await synthesizeWithMiniMaxSpeech(speechCfg, {
          artifactId: `foley-${cue.cueId}`,
          text: `${cue.material}. ${cue.perceptualIntent}`,
        });
        const dl = await saveMiniMaxAudio(speechCfg, r.audioBase64, `foley-${cue.cueId}`);
        insertMultimodalAsset(db, {
          runId,
          agentId: 'sound_designer',
          kind: 'foley',
          artifactId: cue.cueId,
          storagePath: dl.path,
          contentType: 'audio/mpeg',
          durationSeconds: r.durationMs ? r.durationMs / 1000 : undefined,
          sizeBytes: dl.bytes,
          provider: 'minimax',
          model: speechCfg.model ?? 'speech-2.8-hd',
          metadata: { kind: 'foley_cue', material: cue.material },
        });
      } catch (err) {
        log.warn('foley_skipped', { cueId: cue.cueId, err: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return plan;
}
