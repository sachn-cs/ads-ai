import { NextResponse, type NextRequest } from 'next/server';
import { saveConfig } from '@/src/db/configs';
import { resolveAndAssertSafe, SSRFBlockedError } from '@/src/lib/ssrf';
import { ConfigTestRequestSchema, CinestudioConfigSchema } from '@/src/lib/validation';
import type { CinestudioConfig } from '@/src/types';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/config/test');

interface ProviderTest {
  provider: 'minimax' | 'bedrock' | 'anthropic' | 'openai' | 'google' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

async function testOne(
  p: ProviderTest,
  allowHttp: boolean,
): Promise<{ provider: string; ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    switch (p.provider) {
      case 'minimax': {
        const url = resolveAndAssertSafe(p.baseUrl ?? 'https://api.minimax.io', { allowHttp });
        const base = url.toString().replace(/\/+$/, '');
        const r = await fetch(`${base}/v1/models`, {
          headers: { Authorization: `Bearer ${p.apiKey ?? ''}` },
        });
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          throw new Error(`MiniMax models returned ${r.status}: ${body.slice(0, 100)}`);
        }
        const r2 = await fetch(`${base.replace('/v1', '')}/anthropic/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.apiKey ?? ''}` },
          body: JSON.stringify({
            model: p.model,
            max_tokens: 8,
            messages: [{ role: 'user', content: 'ok' }],
          }),
        });
        if (!r2.ok) {
          const body = await r2.text().catch(() => '');
          throw new Error(`MiniMax text probe returned ${r2.status}: ${body.slice(0, 100)}`);
        }
        return { provider: 'minimax', ok: true, latencyMs: Date.now() - start };
      }
      case 'ollama': {
        const url = resolveAndAssertSafe(p.baseUrl ?? 'http://localhost:11434', { allowHttp: true });
        const r = await fetch(`${url.toString().replace(/\/+$/, '')}/api/tags`);
        if (!r.ok) throw new Error(`Ollama returned ${r.status}`);
        return { provider: 'ollama', ok: true, latencyMs: Date.now() - start };
      }
      case 'bedrock': {
        if (!p.apiKey && !process.env.AWS_ACCESS_KEY_ID) {
          throw new Error('Bedrock needs AWS creds (apiKey or env AWS_*)');
        }
        return { provider: 'bedrock', ok: true, latencyMs: Date.now() - start };
      }
      case 'anthropic':
      case 'openai':
      case 'google': {
        const defaultUrl: Record<string, string> = {
          anthropic: 'https://api.anthropic.com',
          openai: 'https://api.openai.com',
          google: 'https://generativelanguage.googleapis.com',
        };
        const url = resolveAndAssertSafe(p.baseUrl ?? defaultUrl[p.provider] ?? '', { allowHttp });
        const r = await fetch(`${url.toString().replace(/\/+$/, '')}/v1/models`, {
          headers: { Authorization: `Bearer ${p.apiKey ?? ''}` },
        });
        if (!r.ok) throw new Error(`${p.provider} models endpoint returned ${r.status}`);
        return { provider: p.provider, ok: true, latencyMs: Date.now() - start };
      }
      default: {
        const _exhaustive: never = p.provider;
        throw new Error(`Unknown provider: ${String(_exhaustive)}`);
      }
    }
  } catch (err) {
    if (err instanceof SSRFBlockedError) {
      return { provider: p.provider, ok: false, latencyMs: Date.now() - start, error: err.message };
    }
    return {
      provider: p.provider,
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
    const parsed = ConfigTestRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid request', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const body = parsed.data;
    const allowHttp = process.env.NODE_ENV !== 'production';
    const results = await Promise.all(body.providers.map((p) => testOne(p, allowHttp)));
    log.info('config_test_run', { count: body.providers.length, ok: results.filter((r) => r.ok).length });

    if (body.save && body.config) {
      const cfgCheck = CinestudioConfigSchema.safeParse(body.config);
      if (!cfgCheck.success) {
        return NextResponse.json(
          { error: 'invalid config', issues: cfgCheck.error.flatten() },
          { status: 400 },
        );
      }
      const cfgToSave = cfgCheck.data as CinestudioConfig;
      if (!cfgToSave.updatedAt) cfgToSave.updatedAt = new Date().toISOString();
      saveConfig(cfgToSave);
    }
    return NextResponse.json({ results });
  } catch (err) {
    log.error('config_test_failed', { err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
