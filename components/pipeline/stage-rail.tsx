'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

interface CinematicStage {
  id: string;
  label: string;
  description: string;
  status: StageStatus;
  agents: string[];
}

const STAGES: CinematicStage[] = [
  { id: 'idea', label: 'Idea', description: 'Showrunner produces the CinestudioBrief.', status: 'pending', agents: ['showrunner'] },
  { id: 'style', label: 'Style', description: 'StyleGuide constrains every visual agent.', status: 'pending', agents: ['style_guide'] },
  { id: 'script', label: 'Script', description: 'Scene breakdown, dialogue, voiceover.', status: 'pending', agents: ['script_writer'] },
  { id: 'characters', label: 'Characters', description: 'Cast profiles with reference seeds.', status: 'pending', agents: ['character_designer'] },
  { id: 'world', label: 'World', description: 'Locations, palette, sound world.', status: 'pending', agents: ['world_builder'] },
  { id: 'storyboard', label: 'Storyboard', description: 'Shot-by-shot coverage.', status: 'pending', agents: ['storyboard'] },
  { id: 'production', label: 'Production', description: 'Render each shot via the configured providers.', status: 'pending', agents: ['shot_planner', 'render_dispatcher'] },
  { id: 'scoring', label: 'Scoring', description: 'Continuity + critique + composite quality.', status: 'pending', agents: ['continuity_checker', 'critique', 'scoring'] },
  { id: 'post', label: 'Post', description: 'Edit, color, score, sound, voice, distribution.', status: 'pending', agents: ['editor', 'colorist', 'composer', 'sound_designer', 'voice_casting', 'distribution', 'rights_clearance'] },
];

function deriveStageStatuses(
  stages: CinematicStage[],
  events: Array<{ type: string; agentId?: string }>,
): CinematicStage[] {
  const seen = new Set<string>();
  for (const ev of events) {
    if (ev.type === 'agent_completed' && ev.agentId) seen.add(ev.agentId);
    if (ev.type === 'agent_failed' && ev.agentId) seen.add(`fail:${ev.agentId}`);
  }
  const failed = new Set<string>();
  for (const key of seen) {
    if (key.startsWith('fail:')) failed.add(key.slice('fail:'.length));
  }
  let firstUnfinished = true;
  return stages.map((stage) => {
    let status: StageStatus = stage.status;
    if (failed.has('render_dispatcher')) return { ...stage, status: 'failed' };
    const allDone = stage.agents.every((a) => seen.has(a));
    const anyFailed = stage.agents.some((a) => failed.has(a));
    if (anyFailed) status = 'failed';
    else if (allDone) status = 'completed';
    else if (firstUnfinished) {
      const anyStarted = stage.agents.some((a) => seen.has(a));
      if (anyStarted) {
        status = 'running';
        firstUnfinished = false;
      }
    }
    if (status === 'completed') firstUnfinished = false;
    return { ...stage, status };
  });
}

export interface StageRailProps {
  runId: string;
  events: Array<{ type: string; agentId?: string }>;
  status: 'queued' | 'running' | 'awaiting_review' | 'completed' | 'failed' | 'cancelled';
}

export function StageRail({ runId, events, status }: StageRailProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const stages = deriveStageStatuses(STAGES, events);

  async function handleCancel() {
    if (!confirm('Cancel this run? Partial artifacts will be kept but no further agents will fire.')) return;
    setCancelling(true);
    try {
      await fetch(`/api/runs/${runId}/cancel`, { method: 'POST' });
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Production pipeline</CardTitle>
            <CardDescription>Stage-by-stage progress of the 22 agents.</CardDescription>
          </div>
          {(status === 'running' || status === 'queued') && (
            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel run'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {stages.map((s, idx) => (
            <li
              key={s.id}
              className={cn(
                'flex items-start gap-3 rounded-md border p-3',
                s.status === 'running' && 'border-cinematic-gold/60 bg-cinematic-gold/5',
                s.status === 'failed' && 'border-destructive/60 bg-destructive/5',
              )}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-mono">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.label}</span>
                  <StageBadge status={s.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.agents.map((a) => (
                    <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function StageBadge({ status }: { status: StageStatus }) {
  const map: Record<StageStatus, { variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
    pending: { variant: 'secondary', label: 'pending' },
    running: { variant: 'default', label: 'running' },
    completed: { variant: 'success', label: 'done' },
    failed: { variant: 'destructive', label: 'failed' },
    skipped: { variant: 'secondary', label: 'skipped' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
