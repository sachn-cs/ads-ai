import Link from 'next/link';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function CharacterAlertsPanel({ productionId }: { productionId: string | null }) {
  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-gold" />
          Character consistency alerts
        </CardTitle>
        <CardDescription>Wardrobe, posture, and visual-marker drift.</CardDescription>
      </CardHeader>
      <CardContent>
        {productionId ? (
          <Link
            href={`/dashboard/productions/${productionId}/characters`}
            className="text-sm text-gold hover:underline"
          >
            Open Characters →
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">No production selected.</p>
        )}
      </CardContent>
    </Card>
  );
}
