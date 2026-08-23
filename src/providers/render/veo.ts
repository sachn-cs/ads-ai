import { GoogleGenAI } from '@google/genai';
import type { ShotRenderInstruction, ShotRenderResult } from '@/src/models';
import { logger } from '@/src/lib/logger';
import { writeJson } from '@/src/lib/artifacts';
import path from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const log = logger('providers/render/veo');

export interface VeoConfig {
  apiKey: string;
  projectId?: string;
  model: string;
  artifactDir: string;
}

const POLL_INTERVAL_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export async function renderWithVeo(
  cfg: VeoConfig,
  instruction: ShotRenderInstruction,
): Promise<ShotRenderResult> {
  if (!cfg.apiKey) {
    return failed(instruction, 'veo', 'GOOGLE_API_KEY (or GEMINI_API_KEY) is not set for the Veo provider.');
  }

  const startedAt = new Date();
  const logPath = path.join(cfg.artifactDir, 'logs', `veo-${instruction.shotId}.json`);

  try {
    const client = new GoogleGenAI({ apiKey: cfg.apiKey });
    if (cfg.projectId) {
      process.env.GOOGLE_CLOUD_PROJECT = cfg.projectId;
    }

    const prompt = instruction.prompt;
    if (!prompt) {
      return failed(instruction, 'veo', 'ShotRenderInstruction.prompt is empty.');
    }

    log.info('veo_generate_started', { shotId: instruction.shotId, model: cfg.model });
    const initialOperation = await client.models.generateVideos({
      model: cfg.model,
      prompt,
      config: {
        aspectRatio: mapAspect(instruction.aspectRatio),
        durationSeconds: clampDuration(instruction.durationSeconds),
      },
    });
    log.info('veo_generate_dispatched', {
      shotId: instruction.shotId,
      op: initialOperation.name ?? '?',
    });

    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;
    let polls = 0;
    let operation = initialOperation;
    while (!operation.done) {
      if (Date.now() > deadline) {
        return failed(
          instruction,
          'veo',
          `Veo operation timed out after ${DEFAULT_TIMEOUT_MS}ms (${polls} polls).`,
        );
      }
      await sleep(POLL_INTERVAL_MS);
      operation = await client.operations.getVideosOperation({ operation });
      polls += 1;
    }

    const response = operation.response;
    if (!response?.generatedVideos?.length) {
      return failed(instruction, 'veo', 'Veo returned no generated videos.');
    }

    const videoFile = response.generatedVideos[0]?.video;
    if (!videoFile) {
      return failed(instruction, 'veo', 'Veo returned no video file.');
    }

    const fileName = await downloadVeoFile(client, videoFile, instruction.shotId, cfg.artifactDir);
    const fileSize = await stat(fileName).then((s) => s.size).catch(() => 0);

    writeJson(logPath, {
      shotId: instruction.shotId,
      provider: 'veo',
      model: cfg.model,
      op: operation.name ?? null,
      polls,
      durationMs: Date.now() - startedAt.getTime(),
      fileSizeBytes: fileSize,
      fileName,
      completedAt: new Date().toISOString(),
    });

    return {
      shotId: instruction.shotId,
      provider: 'veo',
      status: 'completed',
      videoPath: fileName,
      stillPath: fileName.replace(/\.mp4$/, '.png'),
      durationSeconds: instruction.durationSeconds,
      modelUsed: cfg.model,
      costUnits: 1,
      attempts: 1,
      completedAt: new Date().toISOString(),
      metadata: {
        op: operation.name,
        polls,
        fileSizeBytes: fileSize,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('veo_generate_failed', { shotId: instruction.shotId, err: message });
    writeJson(logPath, {
      shotId: instruction.shotId,
      provider: 'veo',
      model: cfg.model,
      error: message,
      durationMs: Date.now() - startedAt.getTime(),
    });
    return failed(instruction, 'veo', message);
  }
}

async function downloadVeoFile(
  client: GoogleGenAI,
  videoFile: unknown,
  shotId: string,
  artifactDir: string,
): Promise<string> {
  await mkdir(path.join(artifactDir, 'renders'), { recursive: true });
  const outPath = path.join(artifactDir, 'renders', `${shotId}-${randomUUID()}.mp4`);

  const fileArg = videoFile && typeof videoFile === 'object' && 'name' in videoFile
    ? (videoFile as { name: string }).name
    : (videoFile as string | { uri: string });

  await client.files.download({ file: fileArg as never, downloadPath: outPath });
  return outPath;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failed(instruction: ShotRenderInstruction, provider: 'veo', message: string): ShotRenderResult {
  return {
    shotId: instruction.shotId,
    provider,
    status: 'failed',
    errorMessage: message,
    attempts: 1,
    metadata: { stub: false },
  };
}

function mapAspect(ratio: ShotRenderInstruction['aspectRatio']): '9:16' | '16:9' {
  switch (ratio) {
    case '9:16':
    case '1:1':
      return '9:16';
    case '16:9':
    case '21:9':
    case '4:3':
    default:
      return '16:9';
  }
}

function clampDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return 8;
  if (seconds < 2) return 2;
  if (seconds > 8) return 8;
  return Math.round(seconds);
}
