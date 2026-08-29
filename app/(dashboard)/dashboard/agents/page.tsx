import Link from 'next/link';
import { Bot, Activity, ShieldAlert } from 'lucide-react';
import { listProductions } from '@/src/db/productions';
import { getDb } from '@/src/db/client';
import { listAgentStatesForRun } from '@/src/db/agent-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

interface AgentCount {
  agentId: string;
  count: number;
  failed: number;
  avgConfidence: number;
}

export default function AgentsOverviewPage() {
  const productions = listProductions(50, 0);
  const db = getDb();
  const recentRuns = db
    .prepare(`SELECT id, production_id FROM runs ORDER BY created_at DESC LIMIT 20`)
    .all() as { id: string; production_id: string | null }[];

  const byAgent = new Map<string, { count: number; failed: number; confSum: number }>();
  let totalWarnings = 0;
  for (const r of recentRuns) {
    const states = listAgentStatesForRun(r.id);
    for (const s of states) {
      const cur = byAgent.get(s.agentId) ?? { count: 0, failed: 0, confSum: 0 };
      cur.count += 1;
      if (s.state === 'failed') cur.failed += 1;
      cur.confSum += s.confidence;
      byAgent.set(s.agentId, cur);
      totalWarnings += s.warnings.length;
    }
  }
  const rows: AgentCount[] = Array.from(byAgent.entries())
    .map(([agentId, v]) => ({
      agentId,
      count: v.count,
      failed: v.failed,
      avgConfidence: v.count > 0 ? v.confSum / v.count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Agents</p>
        <h1 className="font-display text-3xl">System health</h1>
        <p className="text-sm text-muted-foreground">
          Cross-production view of every agent — execution count, failure rate, average confidence, warnings.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KPI label="Productions" value={String(productions.length)} />
        <KPI label="Recent runs" value={String(recentRuns.length)} />
        <KPI label="Total warnings" value={String(totalWarnings)} />
      </section>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-gold" />
            Agent activity
          </CardTitle>
          <CardDescription>{rows.length} agent{rows.length === 1 ? '' : 's'} with recorded state.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agent executions recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 text-left">Agent</th>
                  <th className="py-2 text-right">Executions</th>
                  <th className="py-2 text-right">Failures</th>
                  <th className="py-2 text-right">Avg confidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.agentId} className="border-b border-border last:border-0">
                    <td className="py-2 font-mono">{r.agentId}</td>
                    <td className="py-2 text-right">{r.count}</td>
                    <td className="py-2 text-right">
                      <Badge variant={r.failed > 0 ? 'destructive' : 'outline'}>{r.failed}</Badge>
                    </td>
                    <td className="py-2 text-right">{(r.avgConfidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-warm" />
            Per-production agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No productions yet.</p>
          ) : (
            <ul className="space-y-1">
              {productions.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/productions/${p.id}/agents`}
                    className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-secondary"
                  >
                    <span className="truncate text-sm text-bone">{p.title}</span>
                    <Badge variant="outline">
                      <Activity className="mr-1 h-3 w-3" /> Open
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
