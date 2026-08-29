import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listCharacters } from '@/src/db/characters';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function WardrobeTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const characters = listCharacters(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Wardrobe</p>
        <h1 className="font-display text-3xl">Costume logic & continuity</h1>
        <p className="text-sm text-muted-foreground">
          Costume Designer outfits each character with intent — personality, social context, scene, and
          continuity-aware choices.
        </p>
      </header>

      {characters.length === 0 ? (
        <EmptyState
          title="No characters yet"
          description="Cast the film first, then the Costume Designer can outfit them."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {characters.map((c) => (
            <Card key={c.id} className="warm-shadow">
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>Wardrobe board</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Outfit variants + scene-by-scene continuity heatmap appear here once the Costume Designer
                  runs.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
