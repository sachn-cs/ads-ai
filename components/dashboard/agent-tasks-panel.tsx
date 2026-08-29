import Link from 'next/link';
import { Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RunRow } from '@/src/db/runs';

export function AgentTasksPanel({ runs }: { runs: RunRow[] }) {
  const running = runs.filter((r) => r.status === 'running').slice(0, 5);
  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-gold" />
          Pending agent tasks
        </CardTitle>
        <CardDescription>Active graph executions across productions.</CardDescription>
      </CardHeader>
      <CardContent>
        {running.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agents working right now.</p>
        ) : (
          <ul className="space-y-2">
            {running.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/dashboard/productions/${r.production_id ?? ''}/runs/${r.id}`}
                  className="truncate text-bone hover:text-gold"
                >
                  {r.title ?? r.prompt.slice(0, 60)}
                </Link>
                <Badge variant="outline" className="border-gold/40 text-gold">
                  running
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
