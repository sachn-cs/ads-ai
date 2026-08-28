import { NextResponse, type NextRequest } from 'next/server';
import { loadConfig, saveConfig, resetConfig } from '@/src/db/configs';
import { CinestudioConfigSchema } from '@/src/lib/validation';
import type { CinestudioConfig } from '@/src/types';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/config');

export async function GET() {
  try {
    const config = loadConfig({ redact: true });
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
    const parsed = CinestudioConfigSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid config', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const existing = loadConfig({ redact: false });
    const merged = mergeConfig(existing, parsed.data);
    const cfgToSave = merged as CinestudioConfig;
    cfgToSave.updatedAt = cfgToSave.updatedAt ?? new Date().toISOString();
    saveConfig(cfgToSave);
    log.info('config_saved', { version: cfgToSave.version });
    const redacted = loadConfig({ redact: true });
    return NextResponse.json(redacted);
  } catch (err) {
    log.error('config_save_failed', { err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const reset = resetConfig();
    return NextResponse.json({
      ...reset,
      textProvider: { ...reset.textProvider, apiKey: undefined, apiKeySet: Boolean(reset.textProvider.apiKey) },
      renderProviders: {
        veo: { ...reset.renderProviders.veo, apiKey: undefined, apiKeySet: Boolean(reset.renderProviders.veo.apiKey) },
        sora: { ...reset.renderProviders.sora, apiKey: undefined, apiKeySet: Boolean(reset.renderProviders.sora.apiKey) },
        runway: { ...reset.renderProviders.runway, apiKey: undefined, apiKeySet: Boolean(reset.renderProviders.runway.apiKey) },
        minimax: { ...reset.renderProviders.minimax, apiKey: undefined, apiKeySet: Boolean(reset.renderProviders.minimax.apiKey) },
      },
      multimodal: {
        image: { ...reset.multimodal.image, apiKey: undefined, apiKeySet: Boolean(reset.multimodal.image.apiKey) },
        speech: { ...reset.multimodal.speech, apiKey: undefined, apiKeySet: Boolean(reset.multimodal.speech.apiKey) },
        music: { ...reset.multimodal.music, apiKey: undefined, apiKeySet: Boolean(reset.multimodal.music.apiKey) },
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function mergeConfig<T extends Record<string, unknown>>(
  existing: T,
  incoming: T,
): T {
  const out: Record<string, unknown> = JSON.parse(JSON.stringify(existing));
  for (const key of Object.keys(incoming)) {
    const v = (incoming as Record<string, unknown>)[key];
    if (v !== undefined) out[key] = v;
  }
  return out as T;
}

