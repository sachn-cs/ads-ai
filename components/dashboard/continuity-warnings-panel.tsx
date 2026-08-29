import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ContinuityWarningsPanel({
  totals,
  totalUnresolved,
}: {
  totals: { productionId: string; title: string; unresolved: number }[];
  totalUnresolved: number;
}) {
  return (
    <Card className="warm-shadow">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-amber-warm" />
            Continuity warnings
          </CardTitle>
          <CardDescription>
            {totalUnresolved} unresolved across {totals.length} production{totals.length === 1 ? '' : 's'}.
          </CardDescription>
        </div>
        <Badge variant="outline" className="border-amber-warm/40 text-amber-warm">
          {totalUnresolved} open
        </Badge>
      </CardHeader>
      <CardContent>
        {totals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No productions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {totals.slice(0, 5).map((t) => (
              <li key={t.productionId} className="flex items-center justify-between py-2 text-sm">
                <Link
                  href={`/dashboard/productions/${t.productionId}/continuity`}
                  className="truncate text-bone hover:text-gold"
                >
                  {t.title}
                </Link>
                <Badge variant={t.unresolved > 0 ? 'destructive' : 'outline'}>
                  {t.unresolved} gap{t.unresolved === 1 ? '' : 's'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
