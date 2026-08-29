import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Shot } from '@/src/db/shots';

export function ShotCard({ shot }: { shot: Shot }) {
  return (
    <Card className="warm-shadow transition-colors hover:border-gold/40">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{shot.shotSize}</Badge>
          <span className="font-mono text-xs text-muted-foreground">#{shot.number}</span>
        </div>
        <p className="text-sm text-bone">{shot.intent || 'No intent set.'}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{shot.movement || '—'}</span>
          <span>{shot.durationSeconds}s</span>
        </div>
      </CardContent>
    </Card>
  );
}
