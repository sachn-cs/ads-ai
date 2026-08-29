import { NextResponse } from 'next/server';
import { getProduction, updateProduction, archiveProduction } from '@/src/db/productions';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const production = getProduction(id);
  if (!production) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ production });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Parameters<typeof updateProduction>[1] = {};
  if (typeof body.title === 'string') patch.title = body.title;
  if (typeof body.logline === 'string') patch.logline = body.logline;
  if (typeof body.status === 'string') {
    patch.status = body.status as 'draft' | 'active' | 'archived';
  }
  if (typeof body.currentRunId === 'string') patch.currentRunId = body.currentRunId;
  const production = updateProduction(id, patch);
  return NextResponse.json({ production });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  archiveProduction(id);
  return NextResponse.json({ ok: true });
}
