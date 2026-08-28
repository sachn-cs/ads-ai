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

const log = logger('providers/render/runway');

export interface RunwayConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  artifactDir: string;
}

const POLL_INTERVAL_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_BASE_URL = 'https://api.dev.runwayml.com/v1';

type RunwayTaskResponse = {
  id: string;
  status?: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'THROTTLED';
  progress?: number;
  output?: string[];
  failure?: string;
  failureCode?: string;
};

export async function renderWithRunway(
  cfg: RunwayConfig,
  instruction: ShotRenderInstruction,
): Promise<ShotRenderResult> {
  if (!cfg.apiKey) {
    return failed(instruction, 'runway', 'RUNWAY_API_KEY is not set for the Runway provider.');
  }

  const startedAt = new Date();
  const baseUrl = (cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const safeShotId = sanitizePathSegment(instruction.shotId, 'shot');
  const logPath = path.join(cfg.artifactDir, 'logs', `runway-${safeShotId}.json`);

  try {
    log.info('runway_create_started', { shotId: instruction.shotId, model: cfg.model });
    const taskId = await createRunwayTask(baseUrl, cfg, instruction);
    log.info('runway_create_dispatched', { shotId: instruction.shotId, taskId });

    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;
    let polls = 0;
    let task: RunwayTaskResponse;
    while (true) {
      if (Date.now() > deadline) {
        return failed(instruction, 'runway', `Runway task ${taskId} timed out after ${DEFAULT_TIMEOUT_MS}ms (${polls} polls).`);
      }
      await sleep(POLL_INTERVAL_MS);
      task = await getRunwayTask(baseUrl, cfg.apiKey, taskId);
      polls += 1;
      const status = (task.status ?? '').toUpperCase();
      if (status === 'SUCCEEDED') break;
      if (status === 'FAILED' || status === 'CANCELLED') {
        return failed(instruction, 'runway', `Runway task ${taskId} ${status}: ${task.failure ?? task.failureCode ?? 'unknown error'}.`);
      }
    }

    const outputUrl = task.output?.[0];
    if (!outputUrl) {
      return failed(instruction, 'runway', `Runway task ${taskId} succeeded but returned no output URL.`);
    }

    const fileName = await downloadRunwayOutput(outputUrl, safeShotId, cfg.artifactDir);
    const fileSize = await stat(fileName).then((s) => s.size).catch(() => 0);

    writeJson(logPath, {
      shotId: instruction.shotId,
      provider: 'runway',
      model: cfg.model,
      taskId,
      polls,
      durationMs: Date.now() - startedAt.getTime(),
      fileSizeBytes: fileSize,
      fileName,
      completedAt: new Date().toISOString(),
    });

    return {
      shotId: instruction.shotId,
      provider: 'runway',
      status: 'completed',
      videoPath: fileName,
      stillPath: fileName.replace(/\.mp4$/, '.png'),
      durationSeconds: instruction.durationSeconds,
      modelUsed: cfg.model,
      costUnits: 1,
      attempts: 1,
      completedAt: new Date().toISOString(),
      metadata: {
        taskId,
        polls,
        progress: task.progress,
        fileSizeBytes: fileSize,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('runway_generate_failed', { shotId: instruction.shotId, err: message });
    writeJson(logPath, {
      shotId: instruction.shotId,
      provider: 'runway',
      model: cfg.model,
      error: message,
      durationMs: Date.now() - startedAt.getTime(),
    });
    return failed(instruction, 'runway', message);
  }
}

async function createRunwayTask(
  baseUrl: string,
  cfg: RunwayConfig,
  instruction: ShotRenderInstruction,
): Promise<string> {
  const body = {
    model: cfg.model,
    promptText: instruction.prompt,
    duration: clampDuration(instruction.durationSeconds),
    ratio: mapAspect(instruction.aspectRatio),
    seed: instruction.seed,
    referenceImage: instruction.referenceImageHint,
  };
  const response = await fetch(`${baseUrl}/text_to_video`, {
    method: 'POST',
    headers: runwayHeaders(cfg.apiKey),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Runway create task ${response.status}: ${await response.text()}`);
  }
  const payload = (await response.json()) as { id?: string };
  if (!payload.id) throw new Error('Runway create task returned no id.');
  return payload.id;
}

async function getRunwayTask(baseUrl: string, apiKey: string, taskId: string): Promise<RunwayTaskResponse> {
  const response = await fetch(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: runwayHeaders(apiKey),
  });
  if (!response.ok) {
    throw new Error(`Runway get task ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as RunwayTaskResponse;
}

async function downloadRunwayOutput(url: string, shotId: string, artifactDir: string): Promise<string> {
  await mkdir(path.join(artifactDir, 'renders'), { recursive: true });
  const outPath = path.join(artifactDir, 'renders', `${shotId}-${randomUUID()}.mp4`);

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Runway download ${response.status}: ${response.statusText}`);
  }
  await pipeline(Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>), createWriteStream(outPath));
  return outPath;
}

function runwayHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-Runway-Version': '2024-11-06',
  };
}

function mapAspect(ratio: ShotRenderInstruction['aspectRatio']): string {
  switch (ratio) {
    case '9:16':
      return '720:1280';
    case '16:9':
      return '1280:720';
    case '1:1':
      return '1024:1024';
    case '21:9':
      return '1920:800';
    case '4:3':
      return '1024:768';
    default:
      return '1280:720';
  }
}

function clampDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return 5;
  if (seconds < 2) return 2;
  if (seconds > 10) return 10;
  return Math.round(seconds);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failed(instruction: ShotRenderInstruction, provider: 'runway', message: string): ShotRenderResult {
  return {
    shotId: instruction.shotId,
    provider,
    status: 'failed',
    errorMessage: message,
    attempts: 1,
    metadata: { stub: false },
  };
}
