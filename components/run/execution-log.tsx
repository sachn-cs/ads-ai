import { Badge } from '@/components/ui/badge';

interface RunEvent {
  id: number;
  ts: string;
  type: string;
  agentId: string | null;
  payload: Record<string, unknown>;
}

const TYPE_COLOR: Record<string, 'default' | 'outline' | 'destructive' | 'secondary'> = {
  run_started: 'outline',
  run_completed: 'default',
  run_failed: 'destructive',
  agent_started: 'outline',
  agent_completed: 'default',
  agent_failed: 'destructive',
  render_started: 'outline',
  render_completed: 'default',
  render_failed: 'destructive',
};

export function ExecutionLog({ events }: { events: RunEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events yet.</p>;
  }
  return (
    <ul className="max-h-96 space-y-1 overflow-y-auto rounded-md border border-border bg-ink-900/40 p-3 font-mono text-xs">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
          <Badge variant={TYPE_COLOR[e.type] ?? 'secondary'} className="text-[10px]">
            {e.type}
          </Badge>
          <span className="text-bone">{e.agentId ?? 'system'}</span>
        </li>
      ))}
    </ul>
  );
}
