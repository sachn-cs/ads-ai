import { NextResponse } from 'next/server';
import { getProduction } from '@/src/db/productions';
import { listCharacters } from '@/src/db/characters';
import { listLocations } from '@/src/db/locations';
import { listScenes } from '@/src/db/scenes';
import { listShots } from '@/src/db/shots';
import { listTransitions } from '@/src/db/transitions';
import { listContinuity, unresolvedCount } from '@/src/db/continuity-log';
import { listKnowledge } from '@/src/db/knowledge';
import { listAssets } from '@/src/db/assets';
import { listComments } from '@/src/db/comments';
import { listVersions } from '@/src/db/versions';
import { listThreads } from '@/src/db/copilot';

export const dynamic = 'force-dynamic';

const TAB_FETCHERS: Record<string, (productionId: string) => unknown> = {
  characters: listCharacters,
  locations: listLocations,
  scenes: listScenes,
  shots: listShots,
  transitions: listTransitions,
  continuity: (id) => ({ entries: listContinuity(id, {}, 100), unresolved: unresolvedCount(id) }),
  knowledge: listKnowledge,
  assets: listAssets,
  comments: listComments,
  versions: listVersions,
  copilot: listThreads,
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; tab: string }> }) {
  const { id, tab } = await ctx.params;
  const production = getProduction(id);
  if (!production) return NextResponse.json({ error: 'production not found' }, { status: 404 });
  const fetcher = TAB_FETCHERS[tab];
  const data = fetcher ? fetcher(id) : { stub: true, tab };
  return NextResponse.json({ production, tab, data });
}
