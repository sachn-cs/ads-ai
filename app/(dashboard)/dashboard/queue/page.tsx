import Link from 'next/link';
import { listProductions } from '@/src/db/productions';
import { getDb } from '@/src/db/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default function QueuePage() {
  const productions = listProductions(50, 0);
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, status, prompt, title, production_id, created_at FROM runs WHERE status IN ('queued','running') ORDER BY created_at DESC`,
    )
    .all() as { id: string; status: string; prompt: string; title: string | null; production_id: string | null; created_at: string }[];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Queue</p>
        <h1 className="font-display text-3xl">Run queue</h1>
        <p className="text-sm text-muted-foreground">Queued + running pipelines across productions.</p>
      </header>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>{rows.length} active</CardTitle>
          <CardDescription>{productions.length} production{productions.length === 1 ? '' : 's'} total.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active runs.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="flex-1 truncate">
                  <p className="text-sm text-bone">{r.title ?? r.prompt.slice(0, 60)}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.production_id ?? 'no production'} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/productions/new">+ New production</Link>
        </Button>
      </div>
    </div>
  );
}
