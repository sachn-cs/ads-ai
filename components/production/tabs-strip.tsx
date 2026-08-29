'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  href: string;
}

export function TabsStrip({ productionId, tabs }: { productionId: string; tabs: Tab[] }) {
  const pathname = usePathname();
  const base = `/dashboard/productions/${productionId}`;
  return (
    <nav className="sticky top-14 z-20 flex h-11 items-center gap-1 overflow-x-auto border-b border-border bg-background/70 px-6 backdrop-blur">
      {tabs.map((t) => {
        const target = `${base}${t.href}`;
        const active = pathname === target || (t.href !== '' && pathname.startsWith(target));
        return (
          <Link
            key={t.key}
            href={target}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-xs uppercase tracking-wide transition-colors',
              active
                ? 'bg-secondary text-gold ring-gold'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-bone',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
