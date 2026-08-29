import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listProductions } from '@/src/db/productions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductionCard } from '@/components/dashboard/production-card';

export const dynamic = 'force-dynamic';

export default function ProductionsListPage() {
  const productions = listProductions(100, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Productions</p>
          <h1 className="font-display text-3xl font-semibold">Your films</h1>
          <p className="text-sm text-muted-foreground">
            Every story is a production. Open one to work on Story, Characters, Wardrobe, Locations, Scenes,
            Shots, Transitions, and Continuity.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/productions/new">
            <Plus className="h-4 w-4" /> New production
          </Link>
        </Button>
      </header>

      {productions.length === 0 ? (
        <Card className="border-gold/30 warm-shadow">
          <CardHeader>
            <CardTitle>No productions yet</CardTitle>
            <CardDescription>
              Create your first production. Cinestudio's swarm will help shape it before any rendering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/productions/new">
                <Plus className="h-4 w-4" /> New production
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {productions.map((p) => (
            <ProductionCard key={p.id} production={p} />
          ))}
        </section>
      )}
    </div>
  );
}
