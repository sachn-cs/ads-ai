import Database from 'better-sqlite3';
import { ulid } from '@/src/lib/id';

export interface MultimodalAssetRow {
  id: number;
  run_id: string;
  agent_id: string;
  kind: 'character_portrait' | 'storyboard_frame' | 'voice_line' | 'foley' | 'score_stem' | 'cutdown' | 'thumbnail';
  artifact_id: string;
  storage_path: string;
  content_type: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  provider: string | null;
  model: string | null;
  metadata_json: string | null;
  created_at: string;
}

export interface MultimodalAssetInsert {
  runId: string;
  agentId: string;
  kind: MultimodalAssetRow['kind'];
  artifactId: string;
  storagePath: string;
  contentType?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  provider?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export function insertMultimodalAsset(
  db: Database.Database,
  asset: MultimodalAssetInsert,
): string {
  const id = ulid();
  db.prepare(
    `INSERT INTO multimodal_assets (
      run_id, agent_id, kind, artifact_id, storage_path,
      content_type, duration_seconds, width, height, size_bytes,
      provider, model, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    asset.runId,
    asset.agentId,
    asset.kind,
    asset.artifactId,
    asset.storagePath,
    asset.contentType ?? null,
    asset.durationSeconds ?? null,
    asset.width ?? null,
    asset.height ?? null,
    asset.sizeBytes ?? null,
    asset.provider ?? null,
    asset.model ?? null,
    asset.metadata ? JSON.stringify(asset.metadata) : null,
    new Date().toISOString(),
  );
  return id;
}

export function listMultimodalAssets(
  db: Database.Database,
  runId: string,
  kind?: MultimodalAssetRow['kind'],
): MultimodalAssetRow[] {
  if (kind) {
    return db
      .prepare('SELECT * FROM multimodal_assets WHERE run_id = ? AND kind = ? ORDER BY created_at')
      .all(runId, kind) as MultimodalAssetRow[];
  }
  return db
    .prepare('SELECT * FROM multimodal_assets WHERE run_id = ? ORDER BY created_at')
    .all(runId) as MultimodalAssetRow[];
}

export function getMultimodalAsset(
  db: Database.Database,
  runId: string,
  artifactId: string,
): MultimodalAssetRow | undefined {
  return db
    .prepare('SELECT * FROM multimodal_assets WHERE run_id = ? AND artifact_id = ?')
    .get(runId, artifactId) as MultimodalAssetRow | undefined;
}
