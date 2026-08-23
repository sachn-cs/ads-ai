import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { listIdeaVariants } from '@/src/db/idea-variants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = await params;
  const db = getDb();
  const variants = listIdeaVariants(db, runId);
  return NextResponse.json({
    runId,
    variants: variants.map((v) => ({
      variantIndex: v.variant_index,
      selected: v.user_selected === 1,
      variant: JSON.parse(v.variant_json),
      createdAt: v.created_at,
    })),
  });
}
