import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function GapList({ productionId }: { productionId: string | null }) {
  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-gold" />
          Unresolved gaps
        </CardTitle>
        <CardDescription>Continuity, wardrobe, and scene-level fixes needed.</CardDescription>
      </CardHeader>
      <CardContent>
        {productionId ? (
          <Link
            href={`/dashboard/productions/${productionId}/continuity`}
            className="text-sm text-gold hover:underline"
          >
            View continuity →
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">No production selected.</p>
        )}
      </CardContent>
    </Card>
  );
}
