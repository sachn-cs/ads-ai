import Link from 'next/link';
import { Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Scene } from '@/src/db/scenes';

export function SceneLane({ scene }: { scene: Scene }) {
  return (
    <Link href={`/dashboard/productions/${scene.productionId}/scenes#${scene.id}`}>
      <Card className="warm-shadow transition-colors hover:border-gold/40">
        <CardContent className="flex items-center gap-3 p-4">
          <Film className="h-4 w-4 text-gold" />
          <span className="font-mono text-xs text-muted-foreground">#{scene.number}</span>
          <span className="flex-1 truncate font-display text-sm">{scene.title}</span>
          <span className="text-xs text-muted-foreground">{scene.characterIds.length} cast</span>
        </CardContent>
      </Card>
    </Link>
  );
}
