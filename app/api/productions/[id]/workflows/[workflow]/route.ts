import { NextResponse } from 'next/server';
import { getProduction } from '@/src/db/productions';
import { getShot } from '@/src/db/shots';
import { listContinuity } from '@/src/db/continuity-log';
import { startShotWorkflow, resumeShotWorkflow, type WorkflowState } from '@/src/workflow/strands-workflow';
import { loadConfig } from '@/src/db/configs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; workflow: string }> },
) {
  const { id, workflow } = await ctx.params;
  const production = getProduction(id);
  if (!production) return NextResponse.json({ error: 'production not found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { shotId?: string; directive?: string; state?: WorkflowState };
  if (!body.shotId) return NextResponse.json({ error: 'shotId required' }, { status: 400 });
  const shot = getShot(body.shotId);
  if (!shot) return NextResponse.json({ error: 'shot not found' }, { status: 404 });

  if (workflow === 'shot-revision') {
    if (!body.directive) return NextResponse.json({ error: 'directive required' }, { status: 400 });
    const cfg = loadConfig();
    const continuity = listContinuity(id, { shotId: body.shotId }, 50);
    const state = await startShotWorkflow({ cfg: cfg.textProvider, shot, directive: body.directive, continuity });
    return NextResponse.json({ state });
  }
  if (workflow === 'shot-resume' && body.state) {
    const cfg = loadConfig();
    const state = await resumeShotWorkflow(cfg.textProvider, body.state);
    return NextResponse.json({ state });
  }
  return NextResponse.json({ error: `unknown workflow: ${workflow}` }, { status: 400 });
}
