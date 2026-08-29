import { NextResponse } from 'next/server';
import { listThreads, createThread } from '@/src/db/copilot';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ threads: listThreads(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { message?: string; title?: string };
  const message = (body.message ?? '').trim();
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }
  const title = body.title?.trim() || message.slice(0, 60);
  const thread = createThread(id, title);
  const reply = `I hear you: "${message.slice(0, 80)}". Use the slash palette for guided actions (improve-scene, strengthen-character, refine-wardrobe, fix-continuity).`;
  const citations = [
    {
      entityType: 'character' as const,
      entityId: 'example',
      label: 'Characters',
      href: `/dashboard/productions/${id}/characters`,
    },
  ];
  return NextResponse.json({ thread, reply, citations });
}
