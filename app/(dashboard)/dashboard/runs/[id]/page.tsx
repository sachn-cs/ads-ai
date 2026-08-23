import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRun } from '@/src/db/runs';
import { listEvents, listAgentOutputs } from '@/src/db/events';
import { RunLiveView } from '@/components/run-live-view';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();
  const events = listEvents(id);
  const outputs = listAgentOutputs(id);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">Run {id.slice(0, 8)}</h1>
          <p className="text-xs text-muted-foreground">{run.prompt.slice(0, 120)}</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Back to runs
        </Link>
      </div>
      <RunLiveView
        runId={id}
        initialStatus={run.status}
        initialDecision={run.quality_decision as 'GO' | 'NO_GO' | 'CONDITIONAL_GO' | null}
        initialEvents={events.map((e) => ({
          id: e.id,
          runId: id,
          ts: e.ts,
          type: e.type as 'run_started' | 'agent_started' | 'agent_message' | 'agent_completed' | 'agent_failed' | 'render_started' | 'render_progress' | 'render_completed' | 'render_failed' | 'iteration_started' | 'iteration_completed' | 'checkpoint_written' | 'tool_called' | 'run_completed' | 'run_failed',
          agentId: e.agentId ?? undefined,
          payload: e.payload,
        }))}
        initialOutputs={outputs.map((o) => ({ id: o.id, cycle: o.cycle, output: o.output, createdAt: o.createdAt }))}
      />
    </div>
  );
}
