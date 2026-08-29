import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProduction } from '@/src/db/productions';
import { listCharacters } from '@/src/db/characters';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const dynamic = 'force-dynamic';

export default async function CharactersTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const characters = listCharacters(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Characters</p>
          <h1 className="font-display text-3xl">Cast</h1>
          <p className="text-sm text-muted-foreground">
            {characters.length} character{characters.length === 1 ? '' : 's'} in this production.
          </p>
        </div>
        <Button>
          <Link href={`/dashboard/productions/${id}/characters/new`}>+ New character</Link>
        </Button>
      </header>

      {characters.length === 0 ? (
        <EmptyState
          title="Cast your film"
          description="Add characters with appearance, wardrobe, and personality. Character Designer will refine them."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {characters.map((c) => (
            <Card key={c.id} className="warm-shadow">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Avatar>
                  <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <CardDescription>{c.role}</CardDescription>
                </div>
                <Badge variant="outline" className="border-gold/30 text-gold">
                  {c.visualMarkers.length} markers
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-bone">{c.appearance || 'No appearance written yet.'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
