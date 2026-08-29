import Link from 'next/link';
import { Sparkles, Plus, Activity, Film, ShieldAlert, Wand2 } from 'lucide-react';
import { listProductions } from '@/src/db/productions';
import { listRuns } from '@/src/db/runs';
import { unresolvedCount } from '@/src/db/continuity-log';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductionCard } from '@/components/dashboard/production-card';
import { ContinuityWarningsPanel } from '@/components/dashboard/continuity-warnings-panel';
import { AgentTasksPanel } from '@/components/dashboard/agent-tasks-panel';
import { ShotProgressChart } from '@/components/dashboard/shot-progress-chart';
import { RevisionTimeline } from '@/components/dashboard/revision-timeline';
import { NextActionCard } from '@/components/dashboard/next-action-card';
import { RenderStatusFeed } from '@/components/dashboard/render-status-feed';
import { CharacterAlertsPanel } from '@/components/dashboard/character-alerts-panel';
import { GapList } from '@/components/dashboard/gap-list';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function DashboardHome() {
  const productions = listProductions(12, 0);
  const runs = listRuns(8, 0);
  const continuityTotals = productions.map((p) => ({
    productionId: p.id,
    title: p.title,
    unresolved: unresolvedCount(p.id),
  }));
  const totalUnresolved = continuityTotals.reduce((sum, x) => sum + x.unresolved, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Creative Command Center</p>
          <h1 className="font-display text-4xl font-semibold leading-tight">Dashboard</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Cinestudio coordinates a 22-agent swarm across Story, Characters, Wardrobe, Locations, Scenes,
            Shots, Transitions, and Continuity — so the film gets better as you shape it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/templates">
              <Sparkles className="h-4 w-4" /> Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/productions/new">
              <Plus className="h-4 w-4" /> New production
            </Link>
          </Button>
        </div>
      </header>

      {productions.length === 0 ? (
        <Card className="warm-shadow border-gold/30 cinema-grain">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-gold" /> Make your first film
            </CardTitle>
            <CardDescription>
              Start a production. The swarm will help you shape characters, wardrobe, locations, shots, and
              continuity before any render.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/productions/new">
                <Plus className="h-4 w-4" /> Start a production
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {productions.map((p) => (
              <ProductionCard key={p.id} production={p} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <ContinuityWarningsPanel totals={continuityTotals} totalUnresolved={totalUnresolved} />
              <ShotProgressChart productionId={productions[0]?.id ?? null} />
              <RevisionTimeline runs={runs} />
            </div>
            <div className="space-y-4">
              <NextActionCard productionId={productions[0]?.id ?? null} />
              <RenderStatusFeed runs={runs} />
              <CharacterAlertsPanel productionId={productions[0]?.id ?? null} />
              <AgentTasksPanel runs={runs} />
              <GapList productionId={productions[0]?.id ?? null} />
            </div>
          </section>

          <section className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-gold" />
            <span>Last refreshed just now</span>
            <Badge variant="outline" className="ml-auto border-gold/30 text-gold">
              <Wand2 className="mr-1 h-3 w-3" /> Cinestudio v2
            </Badge>
          </section>
        </>
      )}

      {productions.length === 0 && (
        <Skeleton className="h-32 w-full gold-shimmer" />
      )}

      <aside className="hidden">
        <ShieldAlert className="h-4 w-4" />
      </aside>
    </div>
  );
}
