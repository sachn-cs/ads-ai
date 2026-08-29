import Link from 'next/link';
import { Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { Production } from '@/src/db/productions';

export function ProductionCard({ production }: { production: Production }) {
  const statusColor =
    production.status === 'active'
      ? 'border-gold/40 text-gold'
      : production.status === 'archived'
        ? 'border-muted text-muted-foreground'
        : 'border-border text-bone';

  return (
    <Link href={`/dashboard/productions/${production.id}`} className="group block h-full">
      <Card className="warm-shadow cinema-grain h-full transition-colors group-hover:border-gold/40">
        <CardContent className="space-y-1 p-3">
          <div className="flex items-center justify-between gap-2">
            <Film className="h-3.5 w-3.5 text-gold" />
            <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${statusColor}`}>
              {production.status}
            </Badge>
          </div>
          <h3 className="font-display text-sm leading-tight">{production.title}</h3>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">
            {production.logline || 'No logline yet.'}
          </p>
          <span className="block text-[10px] text-muted-foreground">
            v{production.currentVersion} · {new Date(production.updatedAt).toLocaleDateString()}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}