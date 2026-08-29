import Link from 'next/link';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RunRow } from '@/src/db/runs';

export function RevisionTimeline({ runs }: { runs: RunRow[] }) {
  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-gold" />
          Recent revisions
        </CardTitle>
        <CardDescription>Last 8 runs across productions.</CardDescription>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revisions yet.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/dashboard/productions/${r.production_id ?? ''}/runs/${r.id}`}
                  className="truncate text-bone hover:text-gold"
                >
                  {r.title ?? r.prompt.slice(0, 60)}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
