import path from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { logger } from '@/src/lib/logger';
import { authHeaders, miniMaxFetch, MiniMaxError } from './shared';

const log = logger('providers/minimax/image');

export interface MiniMaxImageConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  artifactDir: string;
}

export interface MiniMaxImageInput {
  artifactId: string;
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | '3:4' | '9:16' | '21:9';
  width?: number;
  height?: number;
  seed?: number;
  n?: number;
}

export interface MiniMaxImageResult {
  imageUrls: string[];
}

export async function generateWithMiniMaxImage(
  cfg: MiniMaxImageConfig,
  input: MiniMaxImageInput,
): Promise<MiniMaxImageResult> {
  const baseUrl = (cfg.baseUrl ?? 'https://api.minimax.io').replace(/\/+$/, '');
  const model = cfg.model ?? 'image-01';

  try {
    log.info('minimax_image_invoking', { artifactId: input.artifactId, model });
    const body: Record<string, unknown> = { model, prompt: input.prompt, n: input.n ?? 1 };
    if (input.aspectRatio) body.aspect_ratio = input.aspectRatio;
    if (input.width && input.height) {
      body.width = input.width;
      body.height = input.height;
    }
    if (typeof input.seed === 'number') body.seed = input.seed;

    const resp = await miniMaxFetch<{ data?: { image_urls?: string[] } }>(
      `${baseUrl}/v1/image_generation`,
      {
        method: 'POST',
        headers: authHeaders(cfg.apiKey),
        body: JSON.stringify(body),
      },
      cfg.apiKey,
    );
    const urls = resp.data?.image_urls ?? [];
    if (urls.length === 0) throw new Error('MiniMax image generation returned no URLs');
    return { imageUrls: urls };
  } catch (err) {
    if (err instanceof MiniMaxError) {
      log.error('minimax_image_failed', { artifactId: input.artifactId, status: err.status, body: err.body });
    } else {
      log.error('minimax_image_error', { artifactId: input.artifactId, err: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }
}

export async function downloadMiniMaxImage(
  cfg: MiniMaxImageConfig,
  imageUrl: string,
  artifactId: string,
): Promise<{ path: string; bytes: number }> {
  const dir = path.join(cfg.artifactDir, 'multimodal', 'images');
  await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, `${artifactId}.png`);
  const response = await fetch(imageUrl);
  if (!response.ok || !response.body) {
    throw new Error(`MiniMax image download failed: ${response.status} ${response.statusText}`);
  }
  await pipeline(Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>), createWriteStream(outPath));
  const st = await stat(outPath);
  return { path: outPath, bytes: st.size };
}
