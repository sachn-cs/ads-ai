import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AgentState } from '@/src/db/agent-state';

const STATE_VARIANT: Record<AgentState['state'], 'default' | 'outline' | 'destructive' | 'secondary'> = {
  pending: 'secondary',
  running: 'default',
  done: 'outline',
  failed: 'destructive',
  blocked: 'secondary',
};

export function AgentGraph({ agents }: { agents: AgentState[] }) {
  if (agents.length === 0) {
    return <p className="text-sm text-muted-foreground">No agent executions recorded.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
      {agents.map((a) => (
        <Card key={a.id} className="warm-shadow">
          <CardContent className="space-y-2 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">{a.agentId}</span>
              <Badge variant={STATE_VARIANT[a.state]}>{a.state}</Badge>
            </div>
            <p className="truncate text-sm text-bone">{a.currentTask || '—'}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>confidence {(a.confidence * 100).toFixed(0)}%</span>
              <span>{a.warnings.length > 0 ? `${a.warnings.length} warnings` : 'no warnings'}</span>
            </div>
            {a.dependencies.length > 0 && (
              <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                depends on {a.dependencies.join(', ')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
