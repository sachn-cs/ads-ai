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
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-3 px-4 py-3 animate-fade-in">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Productions</p>
          <h1 className="font-display text-2xl font-semibold leading-tight">Your films</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/productions/new">
            <Plus className="h-3.5 w-3.5" /> New production
          </Link>
        </Button>
      </header>

      {productions.length === 0 ? (
        <Card className="warm-shadow border-gold/30 flex-1">
          <CardHeader>
            <CardTitle className="text-lg">No productions yet</CardTitle>
            <CardDescription>
              Create your first production. Cinestudio's swarm will help shape it before any rendering.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <Button asChild size="sm">
              <Link href="/dashboard/productions/new">
                <Plus className="h-3.5 w-3.5" /> New production
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid flex-1 grid-cols-2 gap-2 overflow-hidden md:grid-cols-3 xl:grid-cols-4">
          {productions.map((p) => (
            <ProductionCard key={p.id} production={p} />
          ))}
        </section>
      )}
    </div>
  );
}