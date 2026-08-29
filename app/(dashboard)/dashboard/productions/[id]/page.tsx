import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProduction } from '@/src/db/productions';
import { listScenes } from '@/src/db/scenes';
import { listShots } from '@/src/db/shots';
import { listCharacters } from '@/src/db/characters';
import { listLocations } from '@/src/db/locations';
import { unresolvedCount, listContinuity } from '@/src/db/continuity-log';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const dynamic = 'force-dynamic';

export default async function ProductionOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();

  const scenes = listScenes(id);
  const shots = listShots(id);
  const characters = listCharacters(id);
  const locations = listLocations(id);
  const continuity = listContinuity(id, {}, 6);
  const unresolved = unresolvedCount(id);

  const shotCoverage = scenes.length ? Math.min(100, Math.round((shots.length / Math.max(1, scenes.length * 6)) * 100)) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Overview</p>
        <h1 className="font-display text-3xl font-semibold">{production.title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{production.logline || 'No logline yet.'}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Scenes" value={scenes.length} />
        <KPI label="Shots" value={shots.length} />
        <KPI label="Characters" value={characters.length} />
        <KPI label="Locations" value={locations.length} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="warm-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle>Shot coverage</CardTitle>
            <CardDescription>Estimated shots / scene target of 6.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={shotCoverage} className="h-2 bg-ink-800" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Storyboard coverage</span>
              <span className="text-gold">{shotCoverage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="warm-shadow">
          <CardHeader className="space-y-1">
            <CardTitle>Continuity</CardTitle>
            <CardDescription>Open gaps needing attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={unresolved > 0 ? 'destructive' : 'outline'}>{unresolved} unresolved</Badge>
            <div className="mt-3 space-y-1">
              {continuity.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-bone">{c.message}</span>
                  <Badge variant="outline">{c.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <QuickAction href={`/dashboard/productions/${id}/story`} title="Story" subtitle="Logline, treatment, beats" />
        <QuickAction
          href={`/dashboard/productions/${id}/characters`}
          title="Characters"
          subtitle="Cast + wardrobe logic"
        />
        <QuickAction href={`/dashboard/productions/${id}/shots`} title="Shots" subtitle="Storyboard + camera notes" />
      </section>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <Card className="warm-shadow">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-3xl text-gold">{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link href={href}>
      <Card className="warm-shadow transition-colors hover:border-gold/40">
        <CardContent className="space-y-1 p-5">
          <p className="font-display text-lg">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <Button variant="ghost" size="sm" className="mt-2 px-0 text-gold">
            Open →
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
