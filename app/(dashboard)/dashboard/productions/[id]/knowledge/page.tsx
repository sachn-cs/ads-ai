import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listKnowledge, searchKnowledge } from '@/src/db/knowledge';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BibleTabs } from '@/components/knowledge/bible-tabs';

export const dynamic = 'force-dynamic';

export default async function KnowledgeTab({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const production = getProduction(id);
  if (!production) notFound();
  const entries = q ? searchKnowledge(id, q) : listKnowledge(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Knowledge</p>
        <h1 className="font-display text-3xl">Bibles & references</h1>
        <p className="text-sm text-muted-foreground">Story, character, wardrobe, world bibles. FTS5 search.</p>
      </header>

      <BibleTabs />

      {entries.length === 0 ? (
        <EmptyState title="No knowledge entries yet" description="Add story notes, character bibles, wardrobe bibles." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {entries.map((e) => (
            <Card key={e.id} className="warm-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{e.kind}</Badge>
                  <span className="text-xs text-muted-foreground">{e.tags.join(', ') || '—'}</span>
                </div>
                <CardTitle className="text-base">{e.title}</CardTitle>
                <CardDescription className="line-clamp-3">{e.body}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
