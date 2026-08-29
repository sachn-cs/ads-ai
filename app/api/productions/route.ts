import { NextResponse } from 'next/server';
import { listProductions, createProduction, type ProductionCreateInput } from '@/src/db/productions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const productions = listProductions(50, 0);
  return NextResponse.json({ productions });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<ProductionCreateInput>;
  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  const production = createProduction({
    title: body.title.trim(),
    logline: typeof body.logline === 'string' ? body.logline : '',
    status: body.status,
  });
  return NextResponse.json({ production }, { status: 201 });
}
