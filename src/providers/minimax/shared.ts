export interface MiniMaxBaseConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface MiniMaxUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface MiniMaxResponseMeta {
  statusCode: number;
  statusMessage: string;
  traceId?: string;
}

export function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function readStringField(payload: unknown, ...paths: string[]): string | undefined {
  let cursor: unknown = payload;
  for (const p of paths) {
    if (cursor && typeof cursor === 'object' && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

export function readNumberField(payload: unknown, ...paths: string[]): number | undefined {
  let cursor: unknown = payload;
  for (const p of paths) {
    if (cursor && typeof cursor === 'object' && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'number' ? cursor : undefined;
}

export function readUsage(payload: unknown): MiniMaxUsage {
  const usage =
    payload && typeof payload === 'object' && 'usage' in (payload as Record<string, unknown>)
      ? (payload as Record<string, unknown>).usage
      : undefined;
  if (!usage || typeof usage !== 'object') return {};
  const u = usage as Record<string, unknown>;
  const inputTokens =
    readNumberField(u, 'input_tokens') ?? readNumberField(u, 'prompt_tokens');
  const outputTokens =
    readNumberField(u, 'output_tokens') ?? readNumberField(u, 'completion_tokens');
  const totalTokens = readNumberField(u, 'total_tokens');
  return { inputTokens, outputTokens, totalTokens };
}

export class MiniMaxError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    public readonly body: string,
  ) {
    super(`MiniMax ${endpoint} returned ${status}: ${body.slice(0, 200)}`);
    this.name = 'MiniMaxError';
  }
}

export async function miniMaxFetch<T = unknown>(
  url: string,
  init: RequestInit,
  _apiKey: string,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new MiniMaxError(res.status, url, body);
  }
  return (await res.json()) as T;
}
