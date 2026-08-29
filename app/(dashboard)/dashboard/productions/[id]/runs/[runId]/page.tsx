import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getProduction } from '@/src/db/productions';
import { getDb } from '@/src/db/client';
import { listAgentStatesForRun } from '@/src/db/agent-state';
import { listContinuity } from '@/src/db/continuity-log';
import { listEvents } from '@/src/db/events';
import { AgentGraph } from '@/components/run/agent-graph';
import { ExecutionLog } from '@/components/run/execution-log';
import { RunActions } from '@/components/run/run-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const db = getDb();
  const run = db
    .prepare(`SELECT * FROM runs WHERE id = ? AND production_id = ?`)
    .get(runId, id) as
    | {
        id: string;
        status: string;
        prompt: string;
        title: string | null;
        cycle_count: number;
        total_shots: number;
        total_runtime_seconds: number;
        quality_score: number | null;
        quality_decision: string | null;
        created_at: string;
        completed_at: string | null;
      }
    | undefined;
  if (!run) notFound();

  const since = 0;
  const events = listEvents(runId, since);
  const agents = listAgentStatesForRun(runId);
  const continuity = listContinuity(id, { resolved: false }, 20);

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <Link
        href={`/dashboard/productions/${id}/runs`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold"
      >
        <ChevronLeft className="h-3 w-3" /> Back to runs
      </Link>

      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Run</p>
          <h1 className="font-display text-3xl">{run.title ?? run.prompt.slice(0, 80)}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(run.created_at).toLocaleString()}
            {run.completed_at && ` → ${new Date(run.completed_at).toLocaleString()}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline">{run.status}</Badge>
          <RunActions runId={runId} productionId={id} status={run.status} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Cycle" value={String(run.cycle_count)} />
        <KPI label="Total shots" value={String(run.total_shots)} />
        <KPI label="Runtime" value={`${Math.round(run.total_runtime_seconds)}s`} />
        <KPI label="Quality score" value={run.quality_score ? run.quality_score.toFixed(1) : '—'} />
      </section>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Agent graph</CardTitle>
          <CardDescription>Executed agents with status, confidence, and warnings.</CardDescription>
        </CardHeader>
        <CardContent>
          <AgentGraph agents={agents} />
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Execution log</CardTitle>
          <CardDescription>{events.length} events</CardDescription>
        </CardHeader>
        <CardContent>
          <ExecutionLog events={events} />
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Continuity checks</CardTitle>
          <CardDescription>{continuity.length} unresolved gaps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {continuity.length === 0 && (
            <p className="text-sm text-muted-foreground">No unresolved gaps.</p>
          )}
          {continuity.slice(0, 8).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
              <span className="truncate text-bone">{c.message}</span>
              <Badge variant="outline">{c.severity}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card className="warm-shadow">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl text-gold">{value}</p>
      </CardContent>
    </Card>
  );
}
