import { Agent } from '@strands-agents/sdk';
import {
  CharacterCastSchema,
  type CharacterCast,
  type CinestudioBrief,
  type ScriptBreakdown,
} from '@/src/models';
import { CHARACTER_DESIGNER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import { generateWithMiniMaxImage, downloadMiniMaxImage } from '@/src/providers/minimax/image';
import { getDb } from '@/src/db/client';
import { insertMultimodalAsset } from '@/src/db/multimodal-assets';
import { logger } from '@/src/lib/logger';
import path from 'node:path';
import type { CinestudioConfig } from '@/src/types';

const log = logger('agents/character-designer');

export const characterDesignerSpec = {
  id: 'character_designer',
  description:
    'Character designer. Casts roles, defines personalities, visual hooks, and reference seeds for cross-shot consistency. When multimodal image is enabled, also generates one portrait per character and persists it to the multimodal_assets table.',
  systemPrompt: CHARACTER_DESIGNER_SYSTEM_PROMPT,
};

export interface CharacterDesignerInput {
  brief: CinestudioBrief;
  script: ScriptBreakdown;
  previous?: CharacterCast;
}

export async function invokeCharacterDesigner(
  cfg: CinestudioConfig,
  input: CharacterDesignerInput,
  runId?: string,
): Promise<CharacterCast> {
  const agent = new Agent({
    id: characterDesignerSpec.id,
    description: characterDesignerSpec.description,
    systemPrompt: characterDesignerSpec.systemPrompt,
    model: buildModel({ ...cfg.textProvider, temperature: 0.75 }),
    printer: false,
  });
  const prompt = [
    'CINESTUDIO BRIEF:',
    JSON.stringify(input.brief, null, 2),
    '\nSCRIPT BREAKDOWN:',
    JSON.stringify(input.script, null, 2),
    input.previous ? `\nPREVIOUS CAST (preserve references where possible):\n${JSON.stringify(input.previous, null, 2)}\n` : '',
    '\nProduce a CharacterCast. Reference seeds must NEVER describe real people.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: CharacterCastSchema,
  });
  const cast = CharacterCastSchema.parse(result.structuredOutput);

  if (runId && cfg.multimodal.image.enabled && cfg.multimodal.image.apiKey) {
    const imageCfg = {
      apiKey: cfg.multimodal.image.apiKey,
      model: cfg.multimodal.image.model,
      baseUrl: cfg.multimodal.image.baseUrl,
      artifactDir: path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'),
    };
    const db = getDb();
    for (const character of cast.characters) {
      const seedPrompt = `cinematic portrait, ${character.appearance.wardrobe.join(', ')}, ${character.appearance.visualHook}, ${character.referenceSeed}, neutral expression, single subject, soft key light, 35mm film grain, no text, no logos`;
      try {
        const r = await generateWithMiniMaxImage(imageCfg, {
          artifactId: `character-${character.id}`,
          prompt: seedPrompt,
          aspectRatio: '2:3',
        });
        const url = r.imageUrls[0];
        if (!url) continue;
        const dl = await downloadMiniMaxImage(imageCfg, url, character.id);
        insertMultimodalAsset(db, {
          runId,
          agentId: 'character_designer',
          kind: 'character_portrait',
          artifactId: character.id,
          storagePath: dl.path,
          contentType: 'image/png',
          width: 832,
          height: 1248,
          sizeBytes: dl.bytes,
          provider: 'minimax',
          model: imageCfg.model ?? 'image-01',
        });
        log.info('character_portrait_generated', { characterId: character.id, path: dl.path });
      } catch (err) {
        log.warn('character_portrait_skipped', { characterId: character.id, err: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return cast;
}
