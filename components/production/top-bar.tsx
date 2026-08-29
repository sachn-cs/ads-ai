import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Production } from '@/src/db/productions';

export function TopBar({ production }: { production: Production }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
      <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
        <Link href="/dashboard" aria-label="Back to dashboard">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="flex flex-1 items-center gap-3 truncate">
        <span className="font-display text-lg leading-none">{production.title}</span>
        <Badge variant="outline" className="border-gold/30 text-gold">
          {production.status}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">v{production.currentVersion}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Run swarm
        </Button>
      </div>
    </header>
  );
}
