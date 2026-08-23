import path from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { logger } from '@/src/lib/logger';
import { authHeaders, miniMaxFetch, MiniMaxError, readStringField } from './shared';

const log = logger('providers/minimax/video');

export interface MiniMaxVideoConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  artifactDir: string;
}

export interface MiniMaxVideoInput {
  shotId: string;
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:2' | '2:3' | '3:4' | '21:9';
  duration?: number;
  resolution?: '768P' | '2K';
}

export interface MiniMaxVideoResult {
  taskId: string;
  videoUrl: string | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  model: string;
  error?: string;
}

const POLL_INTERVAL_MS = 10_000;
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

const ACCEPTED_ASPECT_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '3:2', '2:3', '3:4', '21:9']);

function mapAspect(r: string | undefined): string {
  if (!r) return '16:9';
  if (ACCEPTED_ASPECT_RATIOS.has(r)) return r;
  return '16:9';
}

export async function renderWithMiniMaxVideo(
  cfg: MiniMaxVideoConfig,
  shot: MiniMaxVideoInput,
): Promise<MiniMaxVideoResult> {
  if (!cfg.apiKey) {
    return { taskId: '', videoUrl: null, status: 'failed', model: cfg.model ?? 'MiniMax-H3', error: 'MiniMax API key not set' };
  }

  const baseUrl = (cfg.baseUrl ?? 'https://api.minimax.io').replace(/\/+$/, '');
  const model = cfg.model ?? 'MiniMax-H3';
  const ratio = mapAspect(shot.aspectRatio);
  const duration = Math.max(4, Math.min(15, shot.duration ?? 5));
  const resolution = shot.resolution ?? '768P';

  try {
    log.info('minimax_video_create_started', { shotId: shot.shotId, model, ratio, duration, resolution });
    const createResp = await miniMaxFetch<{ task_id: string }>(
      `${baseUrl}/v2/video_generation`,
      {
        method: 'POST',
        headers: authHeaders(cfg.apiKey),
        body: JSON.stringify({
          model,
          content: [{ type: 'text', text: shot.prompt }],
          duration,
          resolution,
          ratio,
        }),
      },
      cfg.apiKey,
    );
    const taskId = createResp.task_id;
    if (!taskId) throw new Error('MiniMax video create returned no task_id');

    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;
    let polls = 0;
    while (true) {
      if (Date.now() > deadline) {
        return { taskId, videoUrl: null, status: 'failed', model, error: `MiniMax video timed out after ${DEFAULT_TIMEOUT_MS}ms (${polls} polls)` };
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      polls += 1;
      const queryResp = await miniMaxFetch<unknown>(
        `${baseUrl}/v2/query/video_generation/${encodeURIComponent(taskId)}`,
        { method: 'GET', headers: authHeaders(cfg.apiKey) },
        cfg.apiKey,
      );
      const status = (readStringField(queryResp, 'task', 'status') ?? '').toLowerCase();
      if (status === 'succeeded') {
        const videoUrl = readStringField(queryResp, 'task', 'content', 'url');
        if (!videoUrl) {
          return { taskId, videoUrl: null, status: 'failed', model, error: 'MiniMax video succeeded but returned no url' };
        }
        return { taskId, videoUrl, status: 'succeeded', model };
      }
      if (status === 'failed' || status === 'cancelled') {
        const failure = readStringField(queryResp, 'task', 'error');
        return { taskId, videoUrl: null, status: 'failed', model, error: failure ?? `MiniMax video reported status=${status}` };
      }
    }
  } catch (err) {
    if (err instanceof MiniMaxError) {
      log.error('minimax_video_failed', { shotId: shot.shotId, status: err.status, body: err.body });
      return { taskId: '', videoUrl: null, status: 'failed', model, error: err.message };
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error('minimax_video_error', { shotId: shot.shotId, err: message });
    return { taskId: '', videoUrl: null, status: 'failed', model, error: message };
  }
}

export async function downloadMiniMaxVideo(
  cfg: MiniMaxVideoConfig,
  videoUrl: string,
  shotId: string,
): Promise<{ path: string; bytes: number }> {
  const rendersDir = path.join(cfg.artifactDir, 'renders');
  await mkdir(rendersDir, { recursive: true });
  const outPath = path.join(rendersDir, `${shotId}.mp4`);
  const response = await fetch(videoUrl);
  if (!response.ok || !response.body) {
    throw new Error(`MiniMax video download failed: ${response.status} ${response.statusText}`);
  }
  await pipeline(Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>), createWriteStream(outPath));
  const st = await stat(outPath);
  return { path: outPath, bytes: st.size };
}
