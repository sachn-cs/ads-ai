import { logger } from '@/src/lib/logger';
import { miniMaxFetch, MiniMaxError, readStringField } from './shared';

const log = logger('providers/minimax/upload');

export type UploadPurpose = 'voice_clone' | 'prompt_audio' | 'image_reference' | 'general';

export interface MiniMaxUploadConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface MiniMaxUploadResult {
  fileId: string;
  bytes: number;
}

export async function uploadMiniMaxFile(
  cfg: MiniMaxUploadConfig,
  purpose: UploadPurpose,
  file: { filename: string; bytes: Uint8Array; contentType?: string },
): Promise<MiniMaxUploadResult> {
  const baseUrl = (cfg.baseUrl ?? 'https://api.minimax.io').replace(/\/+$/, '');
  try {
    log.info('minimax_upload_started', { filename: file.filename, purpose, bytes: file.bytes.length });
    const form = new FormData();
    form.append('purpose', purpose);
    const blob = new Blob([file.bytes as BlobPart], { type: file.contentType ?? 'application/octet-stream' });
    form.append('file', blob, file.filename);
    const response = await fetch(`${baseUrl}/v1/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new MiniMaxError(response.status, '/v1/files/upload', body);
    }
    const payload = (await response.json()) as Record<string, unknown>;
    const fileId =
      readStringField(payload, 'file', 'file_id') ?? readStringField(payload, 'file_id');
    if (!fileId) throw new Error('MiniMax upload returned no file_id');
    return { fileId, bytes: file.bytes.length };
  } catch (err) {
    if (err instanceof MiniMaxError) {
      log.error('minimax_upload_failed', { filename: file.filename, status: err.status, body: err.body });
    } else {
      log.error('minimax_upload_error', { filename: file.filename, err: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }
}

void miniMaxFetch;