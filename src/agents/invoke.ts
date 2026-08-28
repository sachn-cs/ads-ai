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

interface EnumIndex {
  path: string;
  values: readonly string[];
}

function collectEnums(schema: z.ZodTypeAny): EnumIndex[] {
  const out: EnumIndex[] = [];
  const walk = (s: z.ZodTypeAny, path: string) => {
    if (s instanceof z.ZodEnum) {
      out.push({ path, values: s.options.map((o) => String(o)) });
      return;
    }
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) {
      walk(s.unwrap() as z.ZodTypeAny, path);
      return;
    }
    if (s instanceof z.ZodArray) {
      walk(s.element as z.ZodTypeAny, `${path}[]`);
      return;
    }
    if (s instanceof z.ZodObject) {
      const shape = (s as unknown as { shape: Record<string, z.ZodTypeAny> }).shape;
      for (const [k, v] of Object.entries(shape)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(schema, '');
  return out;
}

function closestEnum(value: string, allowed: readonly string[]): string | undefined {
  const lower = value.toLowerCase();
  for (const a of allowed) {
    if (a.toLowerCase() === lower) return a;
  }
  for (const a of allowed) {
    if (a.toLowerCase().includes(lower) || lower.includes(a.toLowerCase())) return a;
  }
  return undefined;
}

function applyEnumCoercion(value: unknown, enums: EnumIndex[], pathParts: string[]): unknown {
  if (typeof value !== 'string') return value;
  const path = pathParts.join('.');
  for (const e of enums) {
    if (e.path === path && !e.values.includes(value)) {
      const fixed = closestEnum(value, e.values);
      if (fixed) return fixed;
    }
  }
  return value;
}

function coerce(value: unknown, enums: EnumIndex[], path: string[]): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (/^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value);
    return applyEnumCoercion(value, enums, path);
  }
  if (Array.isArray(value)) return value.map((v, i) => coerce(v, enums, [...path, `${i}`]));
  if (isArrayLikeObject(value)) {
    const keys = Object.keys(value).sort((a, b) => Number(a) - Number(b));
    return keys.map((k) => coerce((value as Record<string, unknown>)[k], enums, [...path, k]));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = coerce(v, enums, [...path, k]);
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
  const enums = collectEnums(opts.schema);

  const result = await invokeMiniMaxAnthropic(
    {
      apiKey: opts.cfg.apiKey ?? '',
      model: opts.cfg.model,
      baseUrl: opts.cfg.baseUrl,
      temperature: opts.temperature ?? opts.cfg.temperature ?? 0.7,
      maxTokens: opts.cfg.maxTokens ?? 16384,
    },
    {
      system: opts.systemPrompt,
      messages: [{ role: 'user', content: opts.userPrompt }],
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
      parsed = opts.schema.parse(coerce(toolUse.input, enums, [])) as T;
    } catch (err) {
      log.warn('agent_tooluse_parse_failed_fallback_regex', {
        agentId: opts.agentId,
        err: String(err).slice(0, 1000),
      });
      const m = result.text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error(`${opts.agentId} produced unparseable output`);
      const obj = JSON.parse(m[0]);
      parsed = opts.schema.parse(coerce(obj, enums, [])) as T;
    }
  } else {
    log.warn('agent_no_tooluse_fallback_regex', { agentId: opts.agentId });
    const m = result.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`${opts.agentId} produced unparseable output`);
    const obj = JSON.parse(m[0]);
    parsed = opts.schema.parse(coerce(obj, enums, [])) as T;
  }

  return { output: parsed, text: result.text, raw: result.raw };
}