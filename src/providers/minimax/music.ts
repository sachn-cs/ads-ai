import path from 'node:path';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { logger } from '@/src/lib/logger';
import { authHeaders, miniMaxFetch, MiniMaxError, readNumberField, readStringField } from './shared';

const log = logger('providers/minimax/music');

export interface MiniMaxMusicConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  artifactDir: string;
}

export interface MiniMaxMusicInput {
  artifactId: string;
  prompt: string;
  lyrics?: string;
  instrumental?: boolean;
  referenceAudio?: string;
}

export interface MiniMaxMusicResult {
  audioHex: string;
  durationMs: number;
  sampleRate: number;
}

export async function generateWithMiniMaxMusic(
  cfg: MiniMaxMusicConfig,
  input: MiniMaxMusicInput,
): Promise<MiniMaxMusicResult> {
  const baseUrl = (cfg.baseUrl ?? 'https://api.minimax.io').replace(/\/+$/, '');
  const model = cfg.model ?? 'music-3.0';
  try {
    log.info('minimax_music_invoking', { artifactId: input.artifactId, model, instrumental: input.instrumental ?? false });
    const body: Record<string, unknown> = {
      model,
      prompt: input.prompt,
      instrumental: input.instrumental ?? false,
      reference_audio: input.referenceAudio,
    };
    if (input.lyrics) body.lyrics = input.lyrics;
    const resp = await miniMaxFetch<{
      data?: { audio?: string };
      extra_info?: Record<string, unknown>;
    }>(`${baseUrl}/v1/music_generation`, {
      method: 'POST',
      headers: authHeaders(cfg.apiKey),
      body: JSON.stringify(body),
    }, cfg.apiKey);
    const hex = resp.data?.audio;
    if (!hex) throw new Error('MiniMax music returned no audio');
    return {
      audioHex: hex,
      durationMs: readNumberField(resp.extra_info, 'audio_length') ?? 0,
      sampleRate: readNumberField(resp.extra_info, 'audio_sample_rate') ?? 44100,
    };
  } catch (err) {
    if (err instanceof MiniMaxError) {
      log.error('minimax_music_failed', { artifactId: input.artifactId, status: err.status, body: err.body });
    } else {
      log.error('minimax_music_error', { artifactId: input.artifactId, err: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }
}

export async function saveMiniMaxMusic(
  cfg: MiniMaxMusicConfig,
  hexAudio: string,
  artifactId: string,
): Promise<{ path: string; bytes: number }> {
  const dir = path.join(cfg.artifactDir, 'multimodal', 'music');
  await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, `${artifactId}.mp3`);
  const buffer = Buffer.from(hexAudio, 'hex');
  await writeFile(outPath, buffer);
  const st = await stat(outPath);
  return { path: outPath, bytes: st.size };
}

void readStringField;
