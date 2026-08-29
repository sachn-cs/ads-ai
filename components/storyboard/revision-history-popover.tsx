import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function RevisionHistoryPopover({ versions }: { versions: { versionNumber: number; createdAt: string; createdBy: string | null }[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">History</Button>
      </PopoverTrigger>
      <PopoverContent>
        <ul className="space-y-1 text-xs">
          {versions.map((v) => (
            <li key={v.versionNumber} className="flex justify-between gap-2">
              <span className="font-mono">v{v.versionNumber}</span>
              <span className="text-muted-foreground">{v.createdBy ?? '—'}</span>
              <span className="text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
