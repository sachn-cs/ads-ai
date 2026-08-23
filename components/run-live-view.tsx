'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { RunEvent, RunSummary } from '@/src/models';

interface InitialOutput {
  id: number;
  cycle: number;
  output: unknown;
  createdAt: string;
}

export interface RunLiveViewProps {
  runId: string;
  initialStatus: RunSummary['status'];
  initialDecision: 'GO' | 'NO_GO' | 'CONDITIONAL_GO' | null;
  initialEvents: Omit<RunEvent, 'id'>[];
  initialOutputs: InitialOutput[];
}

const ORDER = [
  'run_started',
  'showrunner',
  'script_writer',
  'character_designer',
  'world_builder',
  'storyboard',
  'shot_planner',
  'render_dispatch',
  'render_dispatcher',
  'continuity_checker',
  'critique',
  'scoring',
  'iteration_controller',
  'editor',
  'colorist',
  'composer',
  'sound_designer',
  'voice_casting',
  'distribution',
  'rights_clearance',
  'run_completed',
  'run_failed',
] as const;

export function RunLiveView({ runId, initialStatus, initialDecision, initialEvents, initialOutputs }: RunLiveViewProps) {
  const [events, setEvents] = useState<RunEvent[]>(() =>
    initialEvents.map((e, i) => ({ ...e, id: `init-${i}` })) as RunEvent[],
  );
  const [outputs, setOutputs] = useState<InitialOutput[]>(initialOutputs);
  const [status, setStatus] = useState<RunSummary['status']>(initialStatus);
  const [decision, setDecision] = useState<RunLiveViewProps['initialDecision']>(initialDecision);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/runs/${runId}/stream`);
    sourceRef.current = es;
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as RunEvent;
        if (data.type === 'agent_completed') {
          fetch(`/api/runs/${runId}/agents`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows: InitialOutput[]) => setOutputs(rows))
            .catch(() => undefined);
        }
        setEvents((prev) => [...prev, data]);
        if (data.type === 'run_completed') setStatus('completed');
        if (data.type === 'run_failed') setStatus('failed');
      } catch {
        /* heartbeat */
      }
    };
    es.onerror = () => {
      /* network drop; will auto-retry */
    };
    return () => es.close();
  }, [runId]);

  const progress = useMemo(() => {
    let idx = 0;
    for (const e of events) {
      const o = ORDER.indexOf(e.type as (typeof ORDER)[number]);
      if (o >= 0 && o > idx) idx = o;
    }
    return Math.min(100, Math.round((idx / (ORDER.length - 1)) * 100));
  }, [events]);

  const renders = events.filter((e) => e.type === 'render_started' || e.type === 'render_completed' || e.type === 'render_failed');
  const renderOk = events.filter((e) => e.type === 'render_completed').length;
  const renderFailed = events.filter((e) => e.type === 'render_failed').length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {status} · {renderOk} rendered · {renderFailed} failed
              </p>
            </div>
            {decision && (
              <Badge variant={decision === 'GO' ? 'success' : decision === 'NO_GO' ? 'destructive' : 'warning'}>
                {decision}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
          <TabsTrigger value="agents">Agents ({outputs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {ORDER.map((step) => {
                  const matching = events.filter((e) => e.type === step || e.agentId === step);
                  const last = matching.at(-1);
                  const done = !!last && (last.type === 'agent_completed' || last.type === 'render_completed' || last.type === 'run_completed');
                  const failed = !!events.find((e) => (e.agentId === step || e.type === step) && (e.type === 'agent_failed' || e.type === 'render_failed'));
                  const started = matching.length > 0;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          failed ? 'bg-destructive' : done ? 'bg-emerald-500' : started ? 'bg-amber-500 animate-pulse' : 'bg-muted'
                        }`}
                      />
                      <div className="font-mono text-sm">{step}</div>
                      {last && (
                        <div className="ml-auto text-xs text-muted-foreground">
                          {new Date(last.ts).toLocaleTimeString()} · {last.type}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[480px]">
                <pre className="text-[11px] leading-snug">
                  {events.map((e) => (
                    <div key={e.id} className="border-b border-border/30 py-1">
                      <span className="text-muted-foreground">{new Date(e.ts).toISOString()}</span>{' '}
                      <span className="font-mono">{e.type}</span>
                      {e.agentId && <span> · {e.agentId}</span>}
                    </div>
                  ))}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardContent className="pt-6">
              {outputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No agent output yet.</p>
              ) : (
                <div className="space-y-2">
                  {outputs.map((o) => (
                    <details key={o.id} className="rounded-md border p-3">
                      <summary className="cursor-pointer font-mono text-sm">
                        {String((o.output as { id?: string })?.id ?? o.output?.constructor?.name ?? 'output')} · cycle {o.cycle}
                      </summary>
                      <pre className="mt-2 max-h-96 overflow-auto text-[11px]">
                        {JSON.stringify(o.output, null, 2)}
                      </pre>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => sourceRef.current?.close()}>
          Pause stream
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {renders.length} render events observed.
      </p>
    </div>
  );
}
