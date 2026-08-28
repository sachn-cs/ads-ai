import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/src/lib/logger';

const log = logger('providers/minimax/text');

export interface MiniMaxTextConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface MiniMaxAnthropicInvokeInput {
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown;
}

export interface MiniMaxAnthropicInvokeOutput {
  text: string;
  usage: { inputTokens?: number; outputTokens?: number };
  stopReason: string | null;
  raw: unknown;
}

export async function invokeMiniMaxAnthropic(
  cfg: MiniMaxTextConfig,
  input: MiniMaxAnthropicInvokeInput,
): Promise<MiniMaxAnthropicInvokeOutput> {
  const client = new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl ?? 'https://api.minimax.io/anthropic',
    timeout: 30 * 60 * 1000,
    maxRetries: 0,
  });
  log.info('minimax_text_invoking', { model: cfg.model });
  const requestParams: Record<string, unknown> = {
    model: cfg.model,
    max_tokens: cfg.maxTokens ?? 8192,
    temperature: cfg.temperature ?? 0.7,
    system: input.system,
    messages: input.messages,
  };
  if (input.tools && Array.isArray(input.tools) && input.tools.length > 0) {
    requestParams.tools = input.tools;
  }
  const response = (await client.messages.create(
    requestParams as unknown as Parameters<typeof client.messages.create>[0],
  )) as unknown as {
    content: Array<{ type: string; text?: string; input?: unknown; name?: string }>;
    usage: { input_tokens?: number; output_tokens?: number };
    stop_reason: string | null;
  };
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (typeof b.text === 'string' ? b.text : ''))
    .join('');
  return {
    text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    stopReason: response.stop_reason ?? null,
    raw: response,
  };
}
