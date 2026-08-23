import { NextResponse } from 'next/server';
import { AGENT_IDS, type AgentId } from '@/src/agents';
import { listAgentOutputs } from '@/src/db/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_request.url);
  const agentParam = url.searchParams.get('agent');
  const agentId = AGENT_IDS.find((a) => a === agentParam) as AgentId | undefined;
  const rows = listAgentOutputs(id, agentId);
  return NextResponse.json(rows);
}
