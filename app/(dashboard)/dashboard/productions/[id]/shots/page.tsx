import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listShots } from '@/src/db/shots';
import { EmptyState } from '@/components/production/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function ShotsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const shots = listShots(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Shots</p>
        <h1 className="font-display text-3xl">Shot list</h1>
        <p className="text-sm text-muted-foreground">
          Framing, lens, movement, intent, transitions. Drag to reorder.
        </p>
      </header>

      {shots.length === 0 ? (
        <EmptyState title="No shots yet" description="Run Shot Planner to break each scene into shots." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Framing</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Transitions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shots.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.number}</TableCell>
                <TableCell>
                  <Badge variant="outline">{s.shotSize}</Badge>
                </TableCell>
                <TableCell>{s.framing || '—'}</TableCell>
                <TableCell>{s.movement || '—'}</TableCell>
                <TableCell className="max-w-xs truncate">{s.intent || '—'}</TableCell>
                <TableCell className="font-mono text-xs">{s.durationSeconds}s</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {s.transitionIn ?? '—'} → {s.transitionOut ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
