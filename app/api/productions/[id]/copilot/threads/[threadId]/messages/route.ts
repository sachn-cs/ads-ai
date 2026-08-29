import { NextResponse } from 'next/server';
import { getProduction } from '@/src/db/productions';
import { appendMessage, listMessages, getThread, createThread } from '@/src/db/copilot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; threadId: string }> },
) {
  const { id, threadId } = await ctx.params;
  const production = getProduction(id);
  if (!production) return NextResponse.json({ error: 'production not found' }, { status: 404 });
  const thread = getThread(threadId);
  if (!thread || thread.productionId !== id) {
    return NextResponse.json({ error: 'thread not found' }, { status: 404 });
  }
  return NextResponse.json({ thread, messages: listMessages(threadId) });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; threadId: string }> },
) {
  const { id, threadId } = await ctx.params;
  const production = getProduction(id);
  if (!production) return NextResponse.json({ error: 'production not found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { role?: 'user' | 'assistant' | 'system' | 'tool'; content?: string; citations?: unknown[]; agentId?: string };
  if (!body.content || !body.role) {
    return NextResponse.json({ error: 'role + content required' }, { status: 400 });
  }
  let thread = getThread(threadId);
  if (!thread && threadId === 'new') {
    thread = createThread(id, body.content.slice(0, 60));
  }
  if (!thread || thread.productionId !== id) {
    return NextResponse.json({ error: 'thread not found' }, { status: 404 });
  }
  const message = appendMessage({
    threadId: thread.id,
    role: body.role,
    content: body.content,
    citations: Array.isArray(body.citations) ? (body.citations as never) : [],
    agentId: body.agentId,
  });
  return NextResponse.json({ thread, message });
}
