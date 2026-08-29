import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listScenes } from '@/src/db/scenes';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SceneLane } from '@/components/storyboard/scene-lane';

export const dynamic = 'force-dynamic';

export default async function ScenesTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const scenes = listScenes(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Scenes</p>
        <h1 className="font-display text-3xl">Storyboard</h1>
        <p className="text-sm text-muted-foreground">Vertical scene lanes with horizontal shot cards.</p>
      </header>

      {scenes.length === 0 ? (
        <EmptyState title="No scenes yet" description="Run Scene Composer to break your script into scenes." />
      ) : (
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle>{scenes.length} scene{scenes.length === 1 ? '' : 's'}</CardTitle>
            <CardDescription>Drag to reorder. Click a scene to edit shots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scenes.map((s) => (
              <SceneLane key={s.id} scene={s} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
