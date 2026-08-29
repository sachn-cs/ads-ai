import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listCharacters } from '@/src/db/characters';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AiImproveButton } from '@/components/editor/ai-improve-button';

export const dynamic = 'force-dynamic';

export default async function StoryTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const characters = listCharacters(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Story</p>
        <h1 className="font-display text-3xl">Logline & treatment</h1>
        <p className="text-sm text-muted-foreground">
          Shape the spine of the film. Story Analyst helps you refine beats, themes, and references.
        </p>
      </header>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Logline</CardTitle>
          <CardDescription>One sentence that captures the story.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-bone">{production.logline || 'Not written yet.'}</p>
          <AiImproveButton productionId={id} target="logline" />
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Treatment</CardTitle>
          <CardDescription>Full markdown treatment.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Editor coming in the Story Agent (Phase 2).</p>
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Themes & beats</CardTitle>
          <CardDescription>Emotional throughline and structural beats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge>Themes</Badge>
          <Badge>Beats</Badge>
          <Badge>References</Badge>
        </CardContent>
      </Card>

      {characters.length === 0 && (
        <EmptyState
          title="No characters yet"
          description="Open Characters to seed the cast — the swarm will use them to shape the story."
        />
      )}
    </div>
  );
}
