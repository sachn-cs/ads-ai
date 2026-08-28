import OpenAI from 'openai';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { ShotRenderInstruction, ShotRenderResult } from '@/src/models';
import { logger } from '@/src/lib/logger';
import { writeJson } from '@/src/lib/artifacts';
import { sanitizePathSegment } from '@/src/lib/path';
import path from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';

const log = logger('providers/render/sora');

export interface SoraConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  artifactDir: string;
}

const POLL_INTERVAL_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

const SORA_SIZE_MAP: Record<string, '720x1280' | '1280x720' | '1024x1792' | '1792x1024'> = {
  '9:16': '720x1280',
  '16:9': '1280x720',
  '1:1': '1024x1792',
  '21:9': '1792x1024',
  '4:3': '1280x720',
};

const SORA_DURATION_MAP: Record<number, '4' | '8' | '12'> = {
  4: '4',
  8: '8',
  12: '12',
};

export async function renderWithSora(
  cfg: SoraConfig,
  instruction: ShotRenderInstruction,
): Promise<ShotRenderResult> {
  if (!cfg.apiKey) {
    return failed(instruction, 'sora', 'OPENAI_API_KEY is not set for the Sora provider.');
  }

  const startedAt = new Date();
  const safeShotId = sanitizePathSegment(instruction.shotId, 'shot');
  const logPath = path.join(cfg.artifactDir, 'logs', `sora-${safeShotId}.json`);

  try {
    const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl });
    const size = SORA_SIZE_MAP[instruction.aspectRatio] ?? '1280x720';
    const seconds = pickDuration(instruction.durationSeconds);

    log.info('sora_create_started', { shotId: instruction.shotId, model: cfg.model, size, seconds });
    const video = await client.videos.create({
      model: cfg.model || 'sora-2',
      prompt: instruction.prompt,
      seconds,
      size,
    });
    log.info('sora_create_dispatched', { shotId: instruction.shotId, videoId: video.id });

    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;
    let polls = 0;
    let current = video;
    while (current.status !== 'completed') {
      if (current.status === 'failed') {
        return failed(instruction, 'sora', current.error?.message ?? 'Sora reported status=failed.');
      }
      if (Date.now() > deadline) {
        return failed(instruction, 'sora', `Sora video generation timed out after ${DEFAULT_TIMEOUT_MS}ms (${polls} polls).`);
      }
      await sleep(POLL_INTERVAL_MS);
      current = await client.videos.retrieve(video.id);
      polls += 1;
    }

    const fileName = await downloadSoraVideo(client, video.id, safeShotId, cfg.artifactDir);
    const fileSize = await stat(fileName).then((s) => s.size).catch(() => 0);

    writeJson(logPath, {
      shotId: instruction.shotId,
      provider: 'sora',
      model: cfg.model,
      videoId: video.id,
      polls,
      durationMs: Date.now() - startedAt.getTime(),
      fileSizeBytes: fileSize,
      fileName,
      completedAt: new Date().toISOString(),
    });

    return {
      shotId: instruction.shotId,
      provider: 'sora',
      status: 'completed',
      videoPath: fileName,
      stillPath: fileName.replace(/\.mp4$/, '.png'),
      durationSeconds: Number(seconds),
      modelUsed: current.model,
      costUnits: 1,
      attempts: 1,
      completedAt: new Date().toISOString(),
      metadata: {
        videoId: video.id,
        polls,
        size,
        seconds: Number(seconds),
        fileSizeBytes: fileSize,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('sora_generate_failed', { shotId: instruction.shotId, err: message });
    writeJson(logPath, {
      shotId: instruction.shotId,
      provider: 'sora',
      model: cfg.model,
      error: message,
      durationMs: Date.now() - startedAt.getTime(),
    });
    return failed(instruction, 'sora', message);
  }
}

async function downloadSoraVideo(
  client: OpenAI,
  videoId: string,
  shotId: string,
  artifactDir: string,
): Promise<string> {
  await mkdir(path.join(artifactDir, 'renders'), { recursive: true });
  const outPath = path.join(artifactDir, 'renders', `${shotId}-${randomUUID()}.mp4`);

  const response = await client.videos.downloadContent(videoId);
  if (!response) throw new Error('Sora downloadContent returned no response.');
  const body = response as unknown as { body?: ReadableStream<Uint8Array> | NodeJS.ReadableStream };
  if (!body.body) throw new Error('Sora downloadContent returned no body.');
  await pipeline(Readable.fromWeb(body.body as unknown as WebReadableStream<Uint8Array>), createWriteStream(outPath));
  return outPath;
}

function pickDuration(seconds: number): '4' | '8' | '12' {
  const exact = SORA_DURATION_MAP[seconds];
  if (exact) return exact;
  if (seconds <= 6) return '4';
  if (seconds <= 10) return '8';
  return '12';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failed(instruction: ShotRenderInstruction, provider: 'sora', message: string): ShotRenderResult {
  return {
    shotId: instruction.shotId,
    provider,
    status: 'failed',
    errorMessage: message,
    attempts: 1,
    metadata: { stub: false },
  };
}
