import { Card, CardContent } from '@/components/ui/card';
import type { Shot } from '@/src/db/shots';

export function CameraNotesOverlay({ shot }: { shot: Shot }) {
  return (
    <Card className="bg-ink-900/80 backdrop-blur">
      <CardContent className="space-y-1 p-3 text-xs">
        <p>
          <span className="text-muted-foreground">Framing:</span> {shot.framing || '—'}
        </p>
        <p>
          <span className="text-muted-foreground">Lens:</span> {shot.lens || '—'}
        </p>
        <p>
          <span className="text-muted-foreground">Movement:</span> {shot.movement || '—'}
        </p>
        <p>
          <span className="text-muted-foreground">Intent:</span> {shot.intent || '—'}
        </p>
      </CardContent>
    </Card>
  );
}
