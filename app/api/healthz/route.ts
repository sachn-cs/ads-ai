import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { existsSync, statfsSync } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  let dbOk = false;
  let dbErr: string | undefined;
  let lastRunAge: number | null = null;
  let diskOk = false;
  let diskErr: string | undefined;

  try {
    const db = getDb();
    const row = db.prepare('SELECT MAX(created_at) AS last FROM runs').get() as { last?: string | null };
    dbOk = true;
    if (row?.last) {
      lastRunAge = Math.round((Date.now() - new Date(row.last).getTime()) / 1000);
    }
  } catch (err) {
    dbErr = err instanceof Error ? err.message : String(err);
  }

  try {
    const dataDir = path.resolve(
      process.cwd(),
      process.env.CINESTUDIO_DATA_DIR ?? './data',
    );
    if (existsSync(dataDir)) {
      const stats = statfsSync(dataDir);
      diskOk = stats.bavail > 0;
      if (!diskOk) diskErr = 'no free blocks reported';
    } else {
      diskErr = 'data directory missing';
    }
  } catch (err) {
    diskErr = err instanceof Error ? err.message : String(err);
  }

  const status = dbOk && diskOk ? 'ok' : 'degraded';
  const code = dbOk ? 200 : 503;
  return NextResponse.json(
    {
      status,
      uptime: Math.round(process.uptime()),
      pid: process.pid,
      checks: {
        database: dbOk ? { ok: true } : { ok: false, error: dbErr },
        disk: diskOk ? { ok: true } : { ok: false, error: diskErr },
      },
      lastRunAgeSeconds: lastRunAge,
      ts: new Date().toISOString(),
    },
    { status: code },
  );
}
