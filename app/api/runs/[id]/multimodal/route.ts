import { NextResponse, type NextRequest } from 'next/server';
import path from 'node:path';
import { getDb } from '@/src/db/client';
import { insertMultimodalAsset, listMultimodalAssets } from '@/src/db/multimodal-assets';
import { loadConfig } from '@/src/db/configs';
import { CreateMultimodalAssetRequestSchema } from '@/src/lib/validation';
import { generateWithMiniMaxImage, downloadMiniMaxImage } from '@/src/providers/minimax/image';
import { synthesizeWithMiniMaxSpeech, saveMiniMaxAudio } from '@/src/providers/minimax/speech';
import { generateWithMiniMaxMusic, saveMiniMaxMusic } from '@/src/providers/minimax/music';
import { logger } from '@/src/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger('api/runs/multimodal');

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  try {
    const assets = listMultimodalAssets(getDb(), runId);
    return NextResponse.json({
      runId,
      assets: assets.map((a) => ({
        id: a.id,
        kind: a.kind,
        artifact_id: a.artifact_id,
        storage_path: a.storage_path,
        content_type: a.content_type,
        size_bytes: a.size_bytes,
        created_at: a.created_at,
      })),
    });
  } catch (err) {
    log.error('multimodal_list_failed', { runId, err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
    const parsed = CreateMultimodalAssetRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid request', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const body = parsed.data;
    const config = loadConfig({ redact: false });
    const artifactDir = path.resolve(
      process.cwd(),
      process.env.CINESTUDIO_ARTIFACT_DIR ?? './artifacts',
    );
    const db = getDb();

    let storagePath = '';
    let contentType: string | undefined;
    let sizeBytes: number | undefined;
    let durationSeconds: number | undefined;
    let providerName = 'minimax';
    let modelUsed = '';

    if (body.kind === 'character_portrait' || body.kind === 'storyboard_frame' || body.kind === 'cutdown' || body.kind === 'thumbnail') {
      const cfg = config.multimodal.image;
      if (!cfg.enabled) {
        return NextResponse.json({ error: 'image multimodal disabled' }, { status: 400 });
      }
      const apiKey = cfg.apiKey ?? config.textProvider.apiKey;
      if (!apiKey) {
        return NextResponse.json({ error: 'MiniMax API key not set' }, { status: 400 });
      }
      modelUsed = cfg.model;
      const r = await generateWithMiniMaxImage(
        { apiKey, model: cfg.model, baseUrl: cfg.baseUrl, artifactDir },
        {
          artifactId: body.artifactId,
          prompt: body.prompt,
          aspectRatio: body.aspectRatio ?? '2:3',
        },
      );
      const url = r.imageUrls[0];
      if (!url) {
        return NextResponse.json({ error: 'MiniMax returned no image url' }, { status: 502 });
      }
      const dl = await downloadMiniMaxImage(
        { apiKey, model: cfg.model, baseUrl: cfg.baseUrl, artifactDir },
        url,
        body.artifactId,
      );
      storagePath = dl.path;
      contentType = 'image/png';
      sizeBytes = dl.bytes;
    } else if (body.kind === 'voice_line' || body.kind === 'foley') {
      const cfg = config.multimodal.speech;
      if (!cfg.enabled) {
        return NextResponse.json({ error: 'speech multimodal disabled' }, { status: 400 });
      }
      const apiKey = cfg.apiKey ?? config.textProvider.apiKey;
      if (!apiKey) {
        return NextResponse.json({ error: 'MiniMax API key not set' }, { status: 400 });
      }
      modelUsed = cfg.model;
      const r = await synthesizeWithMiniMaxSpeech(
        { apiKey, model: cfg.model, baseUrl: cfg.baseUrl, artifactDir },
        {
          artifactId: body.artifactId,
          text: body.prompt,
          voiceId: body.voiceId,
        },
      );
      const saved = await saveMiniMaxAudio(
        { apiKey, model: cfg.model, baseUrl: cfg.baseUrl, artifactDir },
        r.audioBase64,
        body.artifactId,
        'audio/mpeg',
      );
      storagePath = saved.path;
      contentType = 'audio/mpeg';
      sizeBytes = saved.bytes;
      durationSeconds = r.durationMs ? r.durationMs / 1000 : undefined;
    } else if (body.kind === 'score_stem') {
      const cfg = config.multimodal.music;
      if (!cfg.enabled) {
        return NextResponse.json({ error: 'music multimodal disabled' }, { status: 400 });
      }
      const apiKey = cfg.apiKey ?? config.textProvider.apiKey;
      if (!apiKey) {
        return NextResponse.json({ error: 'MiniMax API key not set' }, { status: 400 });
      }
      modelUsed = cfg.model;
      const r = await generateWithMiniMaxMusic(
        { apiKey, model: cfg.model, baseUrl: cfg.baseUrl, artifactDir },
        {
          artifactId: body.artifactId,
          prompt: body.prompt,
          instrumental: body.instrumental ?? true,
        },
      );
      const saved = await saveMiniMaxMusic(
        { apiKey, model: cfg.model, baseUrl: cfg.baseUrl, artifactDir },
        r.audioHex,
        body.artifactId,
      );
      storagePath = saved.path;
      contentType = 'audio/mpeg';
      sizeBytes = saved.bytes;
      durationSeconds = r.durationMs ? r.durationMs / 1000 : undefined;
    } else {
      return NextResponse.json(
        { error: `kind "${body.kind}" not supported by on-demand generation` },
        { status: 400 },
      );
    }

    const id = insertMultimodalAsset(db, {
      runId,
      agentId: 'multimodal_api',
      kind: body.kind,
      artifactId: body.artifactId,
      storagePath,
      contentType,
      durationSeconds,
      sizeBytes,
      provider: providerName,
      model: modelUsed,
      metadata: body.metadata,
    });
    log.info('multimodal_asset_created', { runId, kind: body.kind, artifactId: body.artifactId, id });
    return NextResponse.json({ id, runId, kind: body.kind, storagePath, sizeBytes });
  } catch (err) {
    log.error('multimodal_create_failed', { runId, err: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
