import Link from 'next/link';
import { Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDb } from '@/src/db/client';
import { listAgentStatesForRun } from '@/src/db/agent-state';
import type { RunRow } from '@/src/db/runs';

export function AgentTasksPanel({ runs }: { runs: RunRow[] }) {
  const running = runs.filter((r) => r.status === 'running').slice(0, 5);

  type AgentEntry = {
    agentId: string;
    role: string;
    currentTask: string;
    confidence: number;
    warnings: number;
    runId: string;
  };

  const db = getDb();
  void db;
  const entries: AgentEntry[] = [];
  for (const r of running) {
    const states = listAgentStatesForRun(r.id);
    for (const s of states) {
      if (s.state !== 'running') continue;
      entries.push({
        agentId: s.agentId,
        role: s.role,
        currentTask: s.currentTask,
        confidence: s.confidence,
        warnings: s.warnings.length,
        runId: r.id,
      });
    }
  }

  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-gold" />
          Active agents
        </CardTitle>
        <CardDescription>
          {entries.length === 0 ? 'No agents working right now.' : `${entries.length} running`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li
                key={`${e.runId}-${e.agentId}`}
                className="rounded-md border border-border p-2"
              >
                <Link
                  href={`/dashboard/productions/${running.find((r) => r.id === e.runId)?.production_id ?? ''}/runs/${e.runId}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-xs text-bone">{e.agentId}</span>
                  <Badge variant="outline" className="border-gold/40 text-gold">
                    running
                  </Badge>
                </Link>
                <p className="mt-1 truncate text-xs text-muted-foreground">{e.currentTask}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>{e.role || '—'}</span>
                  <span>conf {(e.confidence * 100).toFixed(0)}% · {e.warnings} warnings</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
