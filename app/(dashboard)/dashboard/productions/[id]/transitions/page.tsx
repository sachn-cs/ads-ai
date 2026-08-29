import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listTransitions } from '@/src/db/transitions';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransitionChip } from '@/components/storyboard/transition-chip';

export const dynamic = 'force-dynamic';

export default async function TransitionsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const transitions = listTransitions(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Transitions</p>
        <h1 className="font-display text-3xl">Cut design</h1>
        <p className="text-sm text-muted-foreground">
          Transition Designer assigns per-cut intent and continuity notes.
        </p>
      </header>

      {transitions.length === 0 ? (
        <EmptyState title="No transitions yet" description="Transitions appear once the storyboard is rendered." />
      ) : (
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle>{transitions.length} transition{transitions.length === 1 ? '' : 's'}</CardTitle>
            <CardDescription>From shot → to shot</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <TransitionChip key={t.id} transition={t} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
