import Link from 'next/link';
import { Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Production } from '@/src/db/productions';

export function ProductionCard({ production }: { production: Production }) {
  const statusColor =
    production.status === 'active'
      ? 'border-gold/40 text-gold'
      : production.status === 'archived'
        ? 'border-muted text-muted-foreground'
        : 'border-border text-bone';

  return (
    <Link href={`/dashboard/productions/${production.id}`} className="group block">
      <Card className="warm-shadow cinema-grain h-full transition-colors group-hover:border-gold/40 group-hover:shadow-glow-gold">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-gold" />
              <span className="font-mono text-xs text-muted-foreground">
                v{production.currentVersion}
              </span>
            </div>
            <Badge variant="outline" className={statusColor}>
              {production.status}
            </Badge>
          </div>
          <h3 className="font-display text-xl leading-tight">{production.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {production.logline || 'No logline yet. Add one in Story.'}
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Updated {new Date(production.updatedAt).toLocaleDateString()}
            </span>
            <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80">
              Open
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
