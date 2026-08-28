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

function isArrayLikeObject(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v as Record<string, unknown>);
  if (keys.length === 0) return false;
  return keys.every((k) => /^\d+$/.test(k));
}

function coerceSchema(name: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (/^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value);
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => coerceSchema(name, v));
  if (isArrayLikeObject(value)) {
    const keys = Object.keys(value).sort((a, b) => Number(a) - Number(b));
    return keys.map((k) => coerceSchema(`${name}[${k}]`, (value as Record<string, unknown>)[k]));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = coerceSchema(`${name}.${k}`, v);
    return out;
  }
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