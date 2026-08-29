import { ContinuityHealthChart } from '@/components/analytics/continuity-health-chart';
import { AgentConfidenceChart } from '@/components/analytics/agent-confidence-chart';
import { RenderSuccessRate } from '@/components/analytics/render-success-rate';
import { RevisionCountChart } from '@/components/analytics/revision-count-chart';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Analytics</p>
        <h1 className="font-display text-3xl">Production analytics</h1>
        <p className="text-sm text-muted-foreground">Trends across productions, agents, and renders.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ContinuityHealthChart />
        <AgentConfidenceChart />
        <RenderSuccessRate />
        <RevisionCountChart />
      </section>
    </div>
  );
}
