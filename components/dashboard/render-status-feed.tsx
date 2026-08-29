import { Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RunRow } from '@/src/db/runs';

export function RenderStatusFeed({ runs }: { runs: RunRow[] }) {
  const recent = runs.slice(0, 6);
  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 text-gold" />
          Render status
        </CardTitle>
        <CardDescription>Latest render activity.</CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No renders yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-bone">{r.title ?? r.prompt.slice(0, 60)}</span>
                <Badge variant={r.status === 'completed' ? 'default' : 'outline'}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
