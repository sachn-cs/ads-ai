import type Database from 'better-sqlite3';

export interface RenderJobRow {
  id: number;
  run_id: string;
  shot_id: string;
  provider: 'veo' | 'sora' | 'runway' | 'minimax';
  model: string;
  provider_job_id: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  poll_count: number;
  last_polled_at: string | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
}

export interface RenderJobInsert {
  runId: string;
  shotId: string;
  provider: 'veo' | 'sora' | 'runway' | 'minimax';
  model: string;
  providerJobId?: string;
}

export function insertRenderJob(db: Database.Database, job: RenderJobInsert): number {
  const r = db.prepare(
    `INSERT INTO render_jobs (run_id, shot_id, provider, model, provider_job_id, status, poll_count, started_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)`,
  ).run(
    job.runId,
    job.shotId,
    job.provider,
    job.model,
    job.providerJobId ?? null,
    new Date().toISOString(),
  );
  return Number(r.lastInsertRowid);
}

export function updateRenderJob(
  db: Database.Database,
  id: number,
  patch: Partial<Pick<RenderJobRow, 'provider_job_id' | 'status' | 'poll_count' | 'last_polled_at' | 'completed_at' | 'error'>>,
): void {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const set = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE render_jobs SET ${set} WHERE id = ?`).run(...values, id);
}

export function getRenderJobForShot(
  db: Database.Database,
  runId: string,
  shotId: string,
): RenderJobRow | undefined {
  return db
    .prepare('SELECT * FROM render_jobs WHERE run_id = ? AND shot_id = ? ORDER BY started_at DESC LIMIT 1')
    .get(runId, shotId) as RenderJobRow | undefined;
}

export function listRenderJobs(db: Database.Database, runId: string): RenderJobRow[] {
  return db
    .prepare('SELECT * FROM render_jobs WHERE run_id = ? ORDER BY started_at')
    .all(runId) as RenderJobRow[];
}
