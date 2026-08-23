import Link from 'next/link';
import { PlayCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listRuns, summarize } from '@/src/db/runs';
import { formatRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function DashboardHome() {
  const rows = listRuns(20, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight">Runs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length === 0
              ? 'No runs yet. Start one with a logline or treatment.'
              : `${rows.length} recent run${rows.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4" /> New film
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Make your first film</CardTitle>
            <CardDescription>Give the Showrunner a logline or a treatment. The graph will coordinate the rest.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/new">
                <PlayCircle className="h-4 w-4" /> Start a run
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {rows.map((row) => {
            const s = summarize(row);
            return (
              <Link
                key={s.id}
                href={`/dashboard/runs/${s.id}`}
                className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-sm">{s.prompt.slice(0, 120)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(s.createdAt)} · {s.totalShots} shots · {Math.round(s.totalRuntimeSeconds)}s target
                    </div>
                  </div>
                  <StatusBadge status={s.status} decision={s.qualityDecision} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  decision,
}: {
  status: 'queued' | 'running' | 'awaiting_review' | 'completed' | 'failed' | 'cancelled';
  decision?: 'GO' | 'NO_GO' | 'CONDITIONAL_GO';
}) {
  if (status === 'completed' && decision === 'GO') return <Badge variant="success">GO</Badge>;
  if (status === 'completed' && decision === 'CONDITIONAL_GO') return <Badge variant="warning">CONDITIONAL</Badge>;
  if (status === 'completed' && decision === 'NO_GO') return <Badge variant="destructive">NO-GO</Badge>;
  if (status === 'running') return <Badge>Running</Badge>;
  if (status === 'queued') return <Badge variant="secondary">Queued</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}
