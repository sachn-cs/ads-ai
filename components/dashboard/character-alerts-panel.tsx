import Link from 'next/link';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function CharacterAlertsPanel({ productionId }: { productionId: string | null }) {
  return (
    <Card className="warm-shadow h-full">
      <CardHeader className="space-y-0 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Users className="h-3.5 w-3.5 text-gold" /> Character alerts
        </CardTitle>
        <CardDescription className="text-[10px]">Wardrobe + marker drift</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {productionId ? (
          <Link
            href={`/dashboard/productions/${productionId}/characters`}
            className="text-xs text-gold hover:underline"
          >
            Open Characters →
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
      </CardContent>
    </Card>
  );
}