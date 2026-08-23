import { Agent } from '@strands-agents/sdk';
import { ScorePlanSchema, type ScorePlan, type CinestudioBrief, type ScriptBreakdown, type Storyboard } from '@/src/models';
import { COMPOSER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import { generateWithMiniMaxMusic, saveMiniMaxMusic } from '@/src/providers/minimax/music';
import { getDb } from '@/src/db/client';
import { insertMultimodalAsset } from '@/src/db/multimodal-assets';
import { logger } from '@/src/lib/logger';
import path from 'node:path';
import type { CinestudioConfig } from '@/src/types';

const log = logger('agents/composer');

export const composerSpec = {
  id: 'composer',
  description:
    'Composer. Designs the music cue map with motif, sonic palette, and licensing strategy. When multimodal music is enabled, also generates the score stems and persists them to multimodal_assets.',
  systemPrompt: COMPOSER_SYSTEM_PROMPT,
};

export interface ComposerInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  storyboard: Storyboard;
  previous?: ScorePlan;
}

export async function invokeComposer(
  cfg: CinestudioConfig,
  input: ComposerInput,
  runId?: string,
): Promise<ScorePlan> {
  const agent = new Agent({
    id: composerSpec.id,
    description: composerSpec.description,
    systemPrompt: composerSpec.systemPrompt,
    model: buildModel({ ...cfg.textProvider, temperature: 0.85 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nSTORYBOARD:',
    JSON.stringify(input.storyboard, null, 2),
    input.previous ? `\nPREVIOUS SCORE PLAN:\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a ScorePlan.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: ScorePlanSchema,
  });
  const scorePlan = ScorePlanSchema.parse(result.structuredOutput);

  if (runId && cfg.multimodal.music.enabled && cfg.multimodal.music.apiKey) {
    const musicCfg = {
      apiKey: cfg.multimodal.music.apiKey,
      model: cfg.multimodal.music.model,
      baseUrl: cfg.multimodal.music.baseUrl,
      artifactDir: path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'),
    };
    const db = getDb();
    for (const cue of scorePlan.cues) {
      try {
        const lyrics = cue.lyricsHook ? `\n\n[lyrics]\n${cue.lyricsHook}` : '';
        const r = await generateWithMiniMaxMusic(musicCfg, {
          artifactId: `cue-${cue.cueId}`,
          prompt: `${cue.emotionalIntent}, ${cue.instrumentation.join(', ')}, mood: ${input.brief.tone.join(', ')}${lyrics}`,
          instrumental: !cue.lyricsHook,
        });
        const dl = await saveMiniMaxMusic(musicCfg, r.audioHex, cue.cueId);
        insertMultimodalAsset(db, {
          runId,
          agentId: 'composer',
          kind: 'score_stem',
          artifactId: cue.cueId,
          storagePath: dl.path,
          contentType: 'audio/mpeg',
          durationSeconds: r.durationMs ? r.durationMs / 1000 : undefined,
          sizeBytes: dl.bytes,
          provider: 'minimax',
          model: musicCfg.model ?? 'music-3.0',
        });
        log.info('cue_generated', { cueId: cue.cueId });
      } catch (err) {
        log.warn('cue_skipped', { cueId: cue.cueId, err: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return scorePlan;
}
