import Link from 'next/link';
import { Bot, ShieldAlert } from 'lucide-react';
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
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-3 px-4 py-3 animate-fade-in">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Agents</p>
          <h1 className="font-display text-2xl font-semibold leading-tight">System health</h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <KPI label="Productions" value={String(productions.length)} />
          <KPI label="Recent runs" value={String(recentRuns.length)} />
          <KPI label="Warnings" value={String(totalWarnings)} />
        </div>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-3">
        <Card className="warm-shadow lg:col-span-2 h-full">
          <CardHeader className="space-y-0 px-3 py-2">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Bot className="h-3.5 w-3.5 text-gold" />
              Agent activity
            </CardTitle>
            <CardDescription className="text-[10px]">{rows.length} agent{rows.length === 1 ? '' : 's'}</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-2">
            {rows.length === 0 ? (
              <p className="text-xs text-muted-foreground">No agent executions recorded yet.</p>
            ) : (
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-1 text-left">Agent</th>
                      <th className="py-1 text-right">Executions</th>
                      <th className="py-1 text-right">Failures</th>
                      <th className="py-1 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.agentId} className="border-b border-border last:border-0">
                        <td className="py-1 font-mono">{r.agentId}</td>
                        <td className="py-1 text-right">{r.count}</td>
                        <td className="py-1 text-right">
                          <Badge variant={r.failed > 0 ? 'destructive' : 'outline'} className="px-1.5 py-0 text-[10px]">
                            {r.failed}
                          </Badge>
                        </td>
                        <td className="py-1 text-right">{(r.avgConfidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="warm-shadow h-full">
          <CardHeader className="space-y-0 px-3 py-2">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-warm" />
              Per-production agents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2">
            {productions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No productions yet.</p>
            ) : (
              <ul className="max-h-[calc(100vh-220px)] space-y-1 overflow-y-auto">
                {productions.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/productions/${p.id}/agents`}
                      className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-secondary"
                    >
                      <span className="truncate text-bone">{p.title}</span>
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">Open</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-md border border-border bg-card/40 px-2 py-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-display text-base text-gold">{value}</span>
    </div>
  );
}