import path from 'node:path';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { logger } from '@/src/lib/logger';
import { authHeaders, miniMaxFetch, MiniMaxError, readNumberField, readStringField } from './shared';

const log = logger('providers/minimax/speech');

export interface MiniMaxSpeechConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  artifactDir: string;
}

export interface MiniMaxSpeechInput {
  artifactId: string;
  text: string;
  voiceId?: string;
  speed?: number;
  vol?: number;
  pitch?: number;
  emotion?: 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'calm' | 'fluent' | 'whisper';
  languageBoost?: string;
}

export interface MiniMaxSpeechResult {
  audioBase64: string;
  outputFormat: 'hex';
  durationMs: number;
  sampleRate: number;
  usageCharacters: number;
}

export async function synthesizeWithMiniMaxSpeech(
  cfg: MiniMaxSpeechConfig,
  input: MiniMaxSpeechInput,
): Promise<MiniMaxSpeechResult> {
  const baseUrl = (cfg.baseUrl ?? 'https://api.minimax.io').replace(/\/+$/, '');
  const model = cfg.model ?? 'speech-2.8-hd';

  try {
    log.info('minimax_tts_invoking', { artifactId: input.artifactId, model, voiceId: input.voiceId ?? 'English_expressive_narrator' });
    const body: Record<string, unknown> = {
      model,
      text: input.text,
      stream: false,
      output_format: 'hex',
      voice_setting: {
        voice_id: input.voiceId ?? 'English_expressive_narrator',
        speed: input.speed ?? 1.0,
        vol: input.vol ?? 1.0,
        pitch: input.pitch ?? 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1,
      },
      language_boost: input.languageBoost ?? 'auto',
    };
    if (input.emotion) {
      (body.voice_setting as Record<string, unknown>).emotion = input.emotion;
    }
    const resp = await miniMaxFetch<{
      data?: { audio?: string };
      extra_info?: Record<string, unknown>;
    }>(`${baseUrl}/v1/t2a_v2`, {
      method: 'POST',
      headers: authHeaders(cfg.apiKey),
      body: JSON.stringify(body),
    }, cfg.apiKey);
    const hex = resp.data?.audio;
    if (!hex) throw new Error('MiniMax TTS returned no audio data');
    return {
      audioBase64: hex,
      outputFormat: 'hex',
      durationMs: readNumberField(resp.extra_info, 'audio_length') ?? 0,
      sampleRate: readNumberField(resp.extra_info, 'audio_sample_rate') ?? 32000,
      usageCharacters: readNumberField(resp.extra_info, 'usage_characters') ?? input.text.length,
    };
  } catch (err) {
    if (err instanceof MiniMaxError) {
      log.error('minimax_tts_failed', { artifactId: input.artifactId, status: err.status, body: err.body });
    } else {
      log.error('minimax_tts_error', { artifactId: input.artifactId, err: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }
}

export async function saveMiniMaxAudio(
  cfg: MiniMaxSpeechConfig,
  hexAudio: string,
  artifactId: string,
  contentType: 'audio/mpeg' | 'audio/wav' | 'audio/flac' = 'audio/mpeg',
): Promise<{ path: string; bytes: number }> {
  const dir = path.join(cfg.artifactDir, 'multimodal', 'audio');
  await mkdir(dir, { recursive: true });
  const ext = contentType === 'audio/mpeg' ? 'mp3' : contentType === 'audio/wav' ? 'wav' : 'flac';
  const outPath = path.join(dir, `${artifactId}.${ext}`);
  const buffer = Buffer.from(hexAudio, 'hex');
  await writeFile(outPath, buffer);
  const st = await stat(outPath);
  return { path: outPath, bytes: st.size };
}

void readStringField;
