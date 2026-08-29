import { logger } from '@/src/lib/logger';
import { MiniMaxError, readStringField } from './shared';

const log = logger('providers/minimax/files');

const DEFAULT_BASE_URL = 'https://api.minimax.io';

export interface MiniMaxFileConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface MiniMaxFileUpload {
  filename: string;
  bytes: Uint8Array;
  contentType?: string;
}

export interface MiniMaxFileResult {
  fileId: string;
  bytes: number;
}

export async function uploadMiniMaxFile(
  cfg: MiniMaxFileConfig,
  file: MiniMaxFileUpload,
): Promise<MiniMaxFileResult> {
  const baseUrl = (cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  try {
    log.info('minimax_file_upload_started', { filename: file.filename, bytes: file.bytes.length });
    const form = new FormData();
    const blob = new Blob([file.bytes as BlobPart], {
      type: file.contentType ?? 'application/octet-stream',
    });
    form.append('file', blob, file.filename);
    const response = await fetch(`${baseUrl}/v1/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new MiniMaxError(response.status, '/v1/files', body);
    }
    const payload = (await response.json()) as Record<string, unknown>;
    const fileId = readStringField(payload, 'file', 'file_id') ?? readStringField(payload, 'file_id');
    if (!fileId) throw new Error('MiniMax file upload returned no file_id');
    return { fileId, bytes: file.bytes.length };
  } catch (err) {
    if (err instanceof MiniMaxError) {
      log.error('minimax_file_upload_failed', {
        filename: file.filename,
        status: err.status,
        body: err.body,
      });
    } else {
      log.error('minimax_file_upload_error', {
        filename: file.filename,
        err: err instanceof Error ? err.message : String(err),
      });
    }
    throw err;
  }
}
