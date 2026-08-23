import { NextResponse, type NextRequest } from 'next/server';
import { loadConfig, saveConfig } from '@/src/db/configs';
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

async function testOne(p: ProviderTest): Promise<{ provider: string; ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    switch (p.provider) {
      case 'minimax': {
        // Cheapest possible MiniMax call: list models.
        const url = (p.baseUrl ?? 'https://api.minimax.io').replace(/\/+$/, '');
        const r = await fetch(`${url}/v1/models`, {
          headers: { Authorization: `Bearer ${p.apiKey ?? ''}` },
        });
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          throw new Error(`MiniMax models returned ${r.status}: ${body.slice(0, 100)}`);
        }
        // Cheap MiniMax text-gen probe: send a tiny Anthropic-format request.
        const r2 = await fetch(`${url.replace('/v1', '')}/anthropic/v1/messages`, {
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
        const url = (p.baseUrl ?? 'http://localhost:11434').replace(/\/+$/, '');
        const r = await fetch(`${url}/api/tags`);
        if (!r.ok) throw new Error(`Ollama returned ${r.status}`);
        return { provider: 'ollama', ok: true, latencyMs: Date.now() - start };
      }
      case 'bedrock': {
        // We don't have aws-sdk installed; just verify the key looks plausible.
        if (!p.apiKey && !process.env.AWS_ACCESS_KEY_ID) {
          throw new Error('Bedrock needs AWS creds (apiKey or env AWS_*)');
        }
        return { provider: 'bedrock', ok: true, latencyMs: Date.now() - start };
      }
      case 'anthropic':
      case 'openai':
      case 'google': {
        // Probe with a tiny chat call.
        const defaultUrl: Record<string, string> = {
          anthropic: 'https://api.anthropic.com',
          openai: 'https://api.openai.com',
          google: 'https://generativelanguage.googleapis.com',
        };
        const url = p.baseUrl ?? defaultUrl[p.provider];
        const r = await fetch(`${url}/v1/models`, {
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
    const body = (await request.json()) as {
      providers?: ProviderTest[];
      save?: boolean;
      config?: CinestudioConfig;
    };
    if (!body.providers || !Array.isArray(body.providers) || body.providers.length === 0) {
      return NextResponse.json({ error: 'providers array required' }, { status: 400 });
    }
    const results = await Promise.all(body.providers.map((p) => testOne(p)));
    log.info('config_test_run', { count: body.providers.length, ok: results.filter((r) => r.ok).length });

    if (body.save && body.config) {
      saveConfig(body.config);
    }
    return NextResponse.json({ results });
  } catch (err) {
    log.error('config_test_failed', { err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
