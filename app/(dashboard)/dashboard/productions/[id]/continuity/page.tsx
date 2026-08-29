import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listContinuity, unresolvedCount } from '@/src/db/continuity-log';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ContinuityTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const entries = listContinuity(id, {}, 200);
  const unresolved = unresolvedCount(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Continuity</p>
          <h1 className="font-display text-3xl">Continuity log</h1>
          <p className="text-sm text-muted-foreground">
            {unresolved} unresolved gap{unresolved === 1 ? '' : 's'}.
          </p>
        </div>
        <Button variant="outline">Run Continuity Supervisor</Button>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No continuity entries yet"
          description="The Continuity Supervisor emits gaps once Shots are planned."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((e) => (
            <Card key={e.id} className="warm-shadow">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant={e.severity === 'error' ? 'destructive' : e.severity === 'warn' ? 'outline' : 'secondary'}>
                    {e.severity}
                  </Badge>
                  <span className="text-xs uppercase text-muted-foreground">{e.kind}</span>
                </div>
                <CardTitle className="text-sm">{e.message}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline">Resolve</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
