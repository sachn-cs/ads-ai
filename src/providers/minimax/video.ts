import path from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { logger } from '@/src/lib/logger';
import { sanitizePathSegment } from '@/src/lib/path';
import { authHeaders, miniMaxFetch, MiniMaxError, readStringField } from './shared';
import { uploadMiniMaxFile } from './files';

const log = logger('providers/minimax/video');

const DEFAULT_BASE_URL = 'https://api.minimax.io';

export interface MiniMaxVideoConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  artifactDir: string;
}

export type VideoRatio =
  | 'adaptive'
  | '21:9'
  | '16:9'
  | '4:3'
  | '1:1'
  | '3:4'
  | '9:16';

export type VideoResolution = '768P' | '2K';

export type ContentRole =
  | 'first_frame'
  | 'last_frame'
  | 'reference_image'
  | 'reference_video'
  | 'reference_audio';

export interface MiniMaxVideoInput {
  shotId: string;
  prompt: string;
  ratio?: VideoRatio;
  duration?: number;
  resolution?: VideoResolution;
  firstFrame?: MediaAttachment;
  lastFrame?: MediaAttachment;
  referenceImages?: MediaAttachment[];
  referenceVideos?: MediaAttachment[];
  referenceAudios?: MediaAttachment[];
}

export interface MediaAttachment {
  url?: string;
  fileId?: string;
  bytes?: Uint8Array;
  filename?: string;
  contentType?: string;
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

const T2VA_RATIOS: VideoRatio[] = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];
const R2VA_RATIOS: VideoRatio[] = ['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];

const VALID_RESOLUTIONS: VideoResolution[] = ['768P', '2K'];
const VALID_DURATIONS: number[] = Array.from({ length: 12 }, (_, i) => i + 4);

const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

function clampDuration(d: number | undefined): number {
  const v = d ?? 5;
  return VALID_DURATIONS.includes(v) ? v : Math.min(15, Math.max(4, Math.round(v)));
}

function clampRatio(r: VideoRatio | undefined, mode: GenerationMode): VideoRatio {
  if (!r) return mode === 't2va' ? '16:9' : 'adaptive';
  if (mode === 't2va') return T2VA_RATIOS.includes(r) ? r : '16:9';
  if (mode === 'i2va') return 'adaptive';
  return R2VA_RATIOS.includes(r) ? r : 'adaptive';
}

function clampResolution(r: VideoResolution | undefined): VideoResolution {
  return r && VALID_RESOLUTIONS.includes(r) ? r : '768P';
}

type GenerationMode = 't2va' | 'i2va' | 'r2va';

function detectMode(input: MiniMaxVideoInput): GenerationMode {
  if (input.firstFrame || input.lastFrame) return 'i2va';
  if (
    (input.referenceImages && input.referenceImages.length > 0) ||
    (input.referenceVideos && input.referenceVideos.length > 0) ||
    (input.referenceAudios && input.referenceAudios.length > 0)
  ) {
    return 'r2va';
  }
  return 't2va';
}

async function resolveAttachment(
  cfg: MiniMaxVideoConfig,
  att: MediaAttachment,
  kind: 'image' | 'video' | 'audio',
): Promise<{ url: string }> {
  if (att.fileId) return { url: `mm_file://${att.fileId}` };
  if (att.url) return { url: att.url };
  if (att.bytes && att.filename) {
    const allowed =
      (kind === 'image' && att.bytes.length <= MAX_IMAGE_BYTES) ||
      (kind === 'video' && att.bytes.length <= MAX_VIDEO_BYTES) ||
      (kind === 'audio' && att.bytes.length <= MAX_AUDIO_BYTES);
    if (!allowed) {
      throw new Error(
        `${kind} attachment ${att.filename} exceeds size limit (${att.bytes.length} bytes)`,
      );
    }
    const { fileId } = await uploadMiniMaxFile(
      { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl },
      { filename: att.filename, bytes: att.bytes, contentType: att.contentType },
    );
    return { url: `mm_file://${fileId}` };
  }
  throw new Error('attachment requires url, fileId, or bytes+filename');
}

interface ContentItem {
  type: 'text' | 'image_url' | 'video_url' | 'audio_url';
  text?: string;
  image_url?: { url: string };
  video_url?: { url: string };
  audio_url?: { url: string };
  role?: ContentRole;
}

async function buildContent(
  cfg: MiniMaxVideoConfig,
  input: MiniMaxVideoInput,
  mode: GenerationMode,
): Promise<ContentItem[]> {
  const text = input.prompt?.trim();
  if (!text) throw new Error('MiniMax video: prompt (text) is required');
  if (text.length > 7000) throw new Error('MiniMax video: text exceeds 7000 chars');

  const items: ContentItem[] = [{ type: 'text', text }];

  if (mode === 'i2va') {
    if (input.referenceImages?.length || input.referenceVideos?.length || input.referenceAudios?.length) {
      throw new Error('MiniMax video: image-to-video and reference-to-video are mutually exclusive');
    }
    if (input.firstFrame) {
      const { url } = await resolveAttachment(cfg, input.firstFrame, 'image');
      items.push({ type: 'image_url', image_url: { url }, role: 'first_frame' });
    }
    if (input.lastFrame) {
      if (!input.firstFrame) throw new Error('MiniMax video: last_frame requires first_frame');
      const { url } = await resolveAttachment(cfg, input.lastFrame, 'image');
      items.push({ type: 'image_url', image_url: { url }, role: 'last_frame' });
    }
  } else if (mode === 'r2va') {
    if (input.firstFrame || input.lastFrame) {
      throw new Error('MiniMax video: image-to-video and reference-to-video are mutually exclusive');
    }
    for (const img of input.referenceImages ?? []) {
      const { url } = await resolveAttachment(cfg, img, 'image');
      items.push({ type: 'image_url', image_url: { url }, role: 'reference_image' });
    }
    for (const vid of input.referenceVideos ?? []) {
      const { url } = await resolveAttachment(cfg, vid, 'video');
      items.push({ type: 'video_url', video_url: { url }, role: 'reference_video' });
    }
    for (const aud of input.referenceAudios ?? []) {
      const { url } = await resolveAttachment(cfg, aud, 'audio');
      items.push({ type: 'audio_url', audio_url: { url }, role: 'reference_audio' });
    }
  }

  return items;
}

export async function renderWithMiniMaxVideo(
  cfg: MiniMaxVideoConfig,
  shot: MiniMaxVideoInput,
): Promise<MiniMaxVideoResult> {
  if (!cfg.apiKey) {
    return {
      taskId: '',
      videoUrl: null,
      status: 'failed',
      model: cfg.model ?? 'MiniMax-H3',
      error: 'MiniMax API key not set',
    };
  }

  const baseUrl = (cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const model = cfg.model ?? 'MiniMax-H3';
  const mode = detectMode(shot);
  const ratio = clampRatio(shot.ratio, mode);
  const duration = clampDuration(shot.duration);
  const resolution = clampResolution(shot.resolution);

  try {
    const content = await buildContent(cfg, shot, mode);
    log.info('minimax_video_create_started', {
      shotId: shot.shotId,
      model,
      ratio,
      duration,
      resolution,
      mode,
      contentCount: content.length,
    });
    const createResp = await miniMaxFetch<{ task_id: string }>(
      `${baseUrl}/v2/video_generation`,
      {
        method: 'POST',
        headers: authHeaders(cfg.apiKey),
        body: JSON.stringify({ model, content, duration, resolution, ratio }),
      },
      cfg.apiKey,
    );
    const taskId = createResp.task_id;
    if (!taskId) throw new Error('MiniMax video create returned no task_id');

    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;
    let polls = 0;
    while (true) {
      if (Date.now() > deadline) {
        return {
          taskId,
          videoUrl: null,
          status: 'failed',
          model,
          error: `MiniMax video timed out after ${DEFAULT_TIMEOUT_MS}ms (${polls} polls)`,
        };
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
          return {
            taskId,
            videoUrl: null,
            status: 'failed',
            model,
            error: 'MiniMax video succeeded but returned no url',
          };
        }
        return { taskId, videoUrl, status: 'succeeded', model };
      }
      if (status === 'failed' || status === 'cancelled') {
        const failure = readStringField(queryResp, 'task', 'error');
        return {
          taskId,
          videoUrl: null,
          status: 'failed',
          model,
          error: failure ?? `MiniMax video reported status=${status}`,
        };
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
  const outPath = path.join(rendersDir, `${sanitizePathSegment(shotId, 'shot')}.mp4`);
  const response = await fetch(videoUrl);
  if (!response.ok || !response.body) {
    throw new Error(`MiniMax video download failed: ${response.status} ${response.statusText}`);
  }
  await pipeline(
    Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>),
    createWriteStream(outPath),
  );
  const st = await stat(outPath);
  return { path: outPath, bytes: st.size };
}

export const _internal = {
  clampDuration,
  clampRatio,
  clampResolution,
  detectMode,
  buildContent,
  resolveAttachment,
};
