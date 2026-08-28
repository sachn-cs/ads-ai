import { z } from 'zod';
import type { TextProviderConfig } from '@/src/types';
import { invokeMiniMaxAnthropic } from '@/src/providers/minimax/text';
import { logger } from '@/src/lib/logger';

const log = logger('agents/invoke');

export interface InvokeOptions {
  agentId: string;
  cfg: TextProviderConfig;
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodTypeAny;
  temperature?: number;
}

export interface InvokeResult<T> {
  output: T;
  text: string;
  raw: unknown;
}

function schemaToOpenApi(schema: z.ZodTypeAny): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: 'openApi3' }) as Record<string, unknown>;
}

function coerceSchema(name: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  return value;
}

export async function invokeStructuredAgent<T>(
  opts: InvokeOptions,
): Promise<InvokeResult<T>> {
  log.info('agent_invoking', { agentId: opts.agentId });
  const tool = {
    name: 'submit_response',
    description: `Submit the ${opts.agentId} structured response conforming to the schema.`,
    input_schema: schemaToOpenApi(opts.schema),
  };
  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: opts.cfg.apiKey ?? '',
      model: opts.cfg.model,
      baseUrl: opts.cfg.baseUrl,
      temperature: opts.temperature ?? opts.cfg.temperature ?? 0.7,
      maxTokens: opts.cfg.maxTokens ?? 8192,
    },
    {
      system: opts.systemPrompt,
      messages: [
        { role: 'user', content: opts.userPrompt },
      ],
      tools: [tool],
    },
  );

  const raw = result.raw as { content?: Array<{ type: string; name?: string; input?: unknown }> };
  const toolUse = raw.content?.find((b) => b.type === 'tool_use' && b.name === 'submit_response') as
    | { input?: unknown }
    | undefined;

  let parsed: T;
  if (toolUse?.input !== undefined) {
    try {
      parsed = opts.schema.parse(coerceSchema(opts.agentId, toolUse.input)) as T;
    } catch (err) {
      log.warn('agent_tooluse_parse_failed_fallback_regex', {
        agentId: opts.agentId,
        err: String(err),
      });
      const m = result.text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error(`${opts.agentId} produced unparseable output`);
      const obj = JSON.parse(m[0]);
      parsed = opts.schema.parse(coerceSchema(opts.agentId, obj)) as T;
    }
  } else {
    log.warn('agent_no_tooluse_fallback_regex', { agentId: opts.agentId });
    const m = result.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`${opts.agentId} produced unparseable output`);
    const obj = JSON.parse(m[0]);
    parsed = opts.schema.parse(coerceSchema(opts.agentId, obj)) as T;
  }

  return { output: parsed, text: result.text, raw: result.raw };
}