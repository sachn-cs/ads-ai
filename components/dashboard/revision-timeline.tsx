import Link from 'next/link';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function RevisionTimeline({ runs }: { runs: { id: string; title: string | null; prompt: string; production_id: string | null; created_at: string }[] }) {
  return (
    <Card className="warm-shadow h-full">
      <CardHeader className="space-y-0 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <History className="h-3.5 w-3.5 text-gold" /> Recent revisions
        </CardTitle>
        <CardDescription className="text-[10px]">{runs.length} runs</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {runs.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-1">
            {runs.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs">
                <Link
                  href={`/dashboard/productions/${r.production_id ?? ''}/runs/${r.id}`}
                  className="truncate text-bone hover:text-gold"
                >
                  {r.title ?? r.prompt.slice(0, 40)}
                </Link>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}