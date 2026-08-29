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
    <Card className="warm-shadow h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 px-3 py-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-warm" />
            Continuity warnings
          </CardTitle>
          <CardDescription className="text-[10px]">{totalUnresolved} open across {totals.length} production{totals.length === 1 ? '' : 's'}.</CardDescription>
        </div>
        <Badge variant="outline" className="shrink-0 border-amber-warm/40 px-1.5 py-0 text-[10px] text-amber-warm">
          {totalUnresolved}
        </Badge>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {totals.length === 0 ? (
          <p className="text-xs text-muted-foreground">No productions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {totals.slice(0, 4).map((t) => (
              <li key={t.productionId} className="flex items-center justify-between py-1 text-xs">
                <Link
                  href={`/dashboard/productions/${t.productionId}/continuity`}
                  className="truncate text-bone hover:text-gold"
                >
                  {t.title}
                </Link>
                <Badge variant={t.unresolved > 0 ? 'destructive' : 'outline'} className="px-1.5 py-0 text-[10px]">
                  {t.unresolved}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}