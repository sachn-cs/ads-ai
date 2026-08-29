'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CopilotThread } from '@/src/db/copilot';

export function LeftRail({
  productionId,
  threads,
}: {
  productionId: string;
  threads: CopilotThread[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-border bg-card/40 ${open ? 'w-72' : 'w-12'}`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {open ? 'Copilot' : 'AI'}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} className="h-7 w-7">
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      {open && (
        <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
          <Button asChild className="w-full justify-start">
            <Link href={`/dashboard/productions/${productionId}/copilot`}>
              <Sparkles className="h-4 w-4" /> New copilot thread
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground">Recent</p>
            {threads.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">No threads yet.</p>
            )}
            {threads.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/productions/${productionId}/copilot?thread=${t.id}`}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-secondary"
              >
                <MessageSquare className="mt-0.5 h-3 w-3 text-gold" />
                <span className="truncate text-bone">{t.title}</span>
              </Link>
            ))}
          </div>
          <div className="mt-auto rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
            <p className="font-display text-sm text-gold">Active agents</p>
            <p>Story Analyst · Character Designer · Costume Designer</p>
          </div>
        </div>
      )}
    </aside>
  );
}
