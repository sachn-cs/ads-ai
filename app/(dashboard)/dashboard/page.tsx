import Link from 'next/link';
import { Sparkles, Plus, Activity, Wand2 } from 'lucide-react';
import { listProductions } from '@/src/db/productions';
import { listRuns } from '@/src/db/runs';
import { unresolvedCount } from '@/src/db/continuity-log';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const primaryId = productions[0]?.id ?? null;

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-3 px-4 py-3 animate-fade-in">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Creative Command Center</p>
          <h1 className="font-display text-2xl font-semibold leading-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/templates">
              <Sparkles className="h-3.5 w-3.5" /> Templates
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/productions/new">
              <Plus className="h-3.5 w-3.5" /> New production
            </Link>
          </Button>
        </div>
      </header>

      {productions.length === 0 ? (
        <Card className="warm-shadow border-gold/30 cinema-grain flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-gold" /> Make your first film
            </CardTitle>
            <CardDescription>
              Start a production. The swarm will help you shape characters, wardrobe, locations, shots, and
              continuity before any render.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <Button asChild size="sm">
              <Link href="/dashboard/productions/new">
                <Plus className="h-4 w-4" /> Start a production
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {productions.slice(0, 8).map((p) => (
              <ProductionCard key={p.id} production={p} />
            ))}
          </section>

          <section className="grid flex-1 grid-cols-2 gap-2 overflow-hidden md:grid-cols-4 xl:grid-cols-5">
            <div className="md:col-span-2 xl:col-span-3">
              <ContinuityWarningsPanel totals={continuityTotals} totalUnresolved={totalUnresolved} />
            </div>
            <ShotProgressChart productionId={primaryId} />
            <NextActionCard productionId={primaryId} />
            <RenderStatusFeed runs={runs} />
            <CharacterAlertsPanel productionId={primaryId} />
            <AgentTasksPanel runs={runs} />
            <GapList productionId={primaryId} />
            <RevisionTimeline runs={runs} />
          </section>

          <footer className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Activity className="h-3 w-3 text-gold" />
            <span>Updated just now</span>
            <Badge variant="outline" className="ml-auto border-gold/30 text-gold">
              <Wand2 className="mr-1 h-2.5 w-2.5" /> Cinestudio v2
            </Badge>
          </footer>
        </>
      )}
    </div>
  );
}