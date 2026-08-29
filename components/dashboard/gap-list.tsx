import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function GapList({ productionId }: { productionId: string | null }) {
  return (
    <Card className="warm-shadow h-full">
      <CardHeader className="space-y-0 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <ListChecks className="h-3.5 w-3.5 text-gold" /> Unresolved gaps
        </CardTitle>
        <CardDescription className="text-[10px]">Continuity, wardrobe, scene</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {productionId ? (
          <Link
            href={`/dashboard/productions/${productionId}/continuity`}
            className="text-xs text-gold hover:underline"
          >
            View continuity →
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
      </CardContent>
    </Card>
  );
}