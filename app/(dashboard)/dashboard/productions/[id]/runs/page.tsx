import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { getDb } from '@/src/db/client';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function RunsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const db = getDb();
  const runs = db
    .prepare(`SELECT id, status, prompt, title, created_at FROM runs WHERE production_id = ? ORDER BY created_at DESC`)
    .all(id) as { id: string; status: string; prompt: string; title: string | null; created_at: string }[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Runs</p>
        <h1 className="font-display text-3xl">Pipeline executions</h1>
        <p className="text-sm text-muted-foreground">{runs.length} run{runs.length === 1 ? '' : 's'} against this production.</p>
      </header>

      {runs.length === 0 ? (
        <EmptyState title="No runs yet" description="Start a run from the top bar to coordinate the swarm." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {runs.map((r) => (
            <Card key={r.id} className="warm-shadow">
              <CardHeader>
                <CardTitle>{r.title ?? r.prompt.slice(0, 80)}</CardTitle>
                <CardDescription>{new Date(r.created_at).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
