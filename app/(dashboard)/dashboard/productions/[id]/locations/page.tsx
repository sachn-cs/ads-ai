import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listLocations } from '@/src/db/locations';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function LocationsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const locations = listLocations(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Locations</p>
        <h1 className="font-display text-3xl">Scenery & atmosphere</h1>
        <p className="text-sm text-muted-foreground">
          Environment Designer shapes weather, texture, architecture, props, and depth.
        </p>
      </header>

      {locations.length === 0 ? (
        <EmptyState title="No locations yet" description="Add a location to begin." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((l) => (
            <Card key={l.id} className="warm-shadow">
              <CardHeader>
                <CardTitle>{l.name}</CardTitle>
                <CardDescription>{l.atmosphere || 'No atmosphere set'}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-bone">{l.texture || 'No texture yet.'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
