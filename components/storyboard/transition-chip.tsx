import { Badge } from '@/components/ui/badge';
import type { Transition } from '@/src/db/transitions';

export function TransitionChip({ transition }: { transition: Transition }) {
  return (
    <Badge variant="outline" className="border-gold/30 text-gold" title={transition.intent}>
      {transition.type}
    </Badge>
  );
}
