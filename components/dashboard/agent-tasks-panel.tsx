import Link from 'next/link';
import { Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AgentTasksPanel({ runs }: { runs: { id: string; status: string; title: string | null; prompt: string; production_id: string | null }[] }) {
  const running = runs.filter((r) => r.status === 'running').slice(0, 4);

  return (
    <Card className="warm-shadow h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 px-3 py-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Bot className="h-3.5 w-3.5 text-gold" /> Active agents
          </CardTitle>
          <CardDescription className="text-[10px]">{running.length} running</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {running.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-1">
            {running.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs">
                <Link
                  href={`/dashboard/productions/${r.production_id ?? ''}/runs/${r.id}`}
                  className="truncate text-bone hover:text-gold"
                >
                  {r.title ?? r.prompt.slice(0, 40)}
                </Link>
                <Badge variant="outline" className="border-gold/40 px-1.5 py-0 text-[10px] text-gold">
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