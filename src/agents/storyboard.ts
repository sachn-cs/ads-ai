import { StoryboardSchema, type Storyboard, type CinestudioBrief, type ScriptBreakdown, type CharacterCast, type WorldDesign } from '@/src/models';
import { STORYBOARD_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
import { generateWithMiniMaxImage, downloadMiniMaxImage } from '@/src/providers/minimax/image';
import { getDb } from '@/src/db/client';
import { insertMultimodalAsset } from '@/src/db/multimodal-assets';
import { logger } from '@/src/lib/logger';
import path from 'node:path';
import type { CinestudioConfig } from '@/src/types';

const log = logger('agents/storyboard');

export const storyboardSpec = {
  id: 'storyboard',
  description:
    'Storyboard artist. Turns script + cast + world into shot-by-shot coverage with batching hints. When multimodal image is enabled, also generates one reference frame per shot and persists it to multimodal_assets.',
  systemPrompt: STORYBOARD_SYSTEM_PROMPT,
};

export interface StoryboardInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  cast: CharacterCast;
  world: WorldDesign;
  previous?: Storyboard;
  iterationDirective?: string;
}

export async function invokeStoryboard(
  cfg: CinestudioConfig,
  input: StoryboardInput,
  runId?: string,
): Promise<Storyboard> {
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    '\nCHARACTER CAST:',
    JSON.stringify(input.cast, null, 2),
    '\nWORLD DESIGN:',
    JSON.stringify(input.world, null, 2),
    input.previous ? `\nPREVIOUS STORYBOARD:\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    input.iterationDirective ? `\nITERATION DIRECTIVE:\n${input.iterationDirective}\n` : '',
    '\nProduce a Storyboard. Pre-compute render batches so the dispatcher can fan out economically.',
  ].join('\n');
  const { output: storyboard } = await invokeStructuredAgent<Storyboard>({
    agentId: 'storyboard',
    cfg: { ...cfg.textProvider, temperature: 0.8 },
    systemPrompt: STORYBOARD_SYSTEM_PROMPT,
    userPrompt: prompt,
    schema: StoryboardSchema,
    temperature: 0.8,
  });

  if (runId && cfg.multimodal.image.enabled && cfg.multimodal.image.apiKey) {
    const imageCfg = {
      apiKey: cfg.multimodal.image.apiKey,
      model: cfg.multimodal.image.model,
      baseUrl: cfg.multimodal.image.baseUrl,
      artifactDir: path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'),
    };
    const db = getDb();
    const aspectForBrief = (ratio: string): '16:9' | '9:16' | '1:1' | '4:3' => {
      if (ratio === '9:16') return '9:16';
      if (ratio === '1:1') return '1:1';
      if (ratio === '4:3') return '4:3';
      return '16:9';
    };
    const aspect = aspectForBrief(input.brief.visualApproach.aspectRatio);
    for (const shot of storyboard.shots) {
      try {
        const framePrompt = `${shot.storyboardPanelPrompt}, world palette ${input.world.colorWorld.palette.join(', ')}, ${input.world.recurringVisualMotifs.join(', ')}, no text, no logos, ${aspect} frame`;
        const r = await generateWithMiniMaxImage(imageCfg, {
          artifactId: `shot-${shot.shotId}-frame`,
          prompt: framePrompt,
          aspectRatio: aspect,
        });
        const url = r.imageUrls[0];
        if (!url) continue;
        const dl = await downloadMiniMaxImage(imageCfg, url, `shot-${shot.shotId}-frame`);
        insertMultimodalAsset(db, {
          runId,
          agentId: 'storyboard',
          kind: 'storyboard_frame',
          artifactId: shot.shotId,
          storagePath: dl.path,
          contentType: 'image/png',
          sizeBytes: dl.bytes,
          provider: 'minimax',
          model: imageCfg.model ?? 'image-01',
        });
        log.info('shot_frame_generated', { shotId: shot.shotId });
      } catch (err) {
        log.warn('shot_frame_skipped', { shotId: shot.shotId, err: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return storyboard;
}