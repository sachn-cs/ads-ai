import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { listVersions } from '@/src/db/versions';
import { History } from 'lucide-react';

export function RevisionHistoryPopover({
  productionId,
  entityType,
  entityId,
}: {
  productionId: string;
  entityType: string;
  entityId: string;
}) {
  const versions = listVersions(productionId, { entityType, entityId });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="mr-1 h-3 w-3" /> History
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
          {entityType} history
        </p>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revisions yet.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {versions.map((v) => (
              <li key={v.id} className="flex justify-between gap-2">
                <span className="font-mono">v{v.versionNumber}</span>
                <span className="text-muted-foreground">{v.createdBy ?? '—'}</span>
                <span className="text-muted-foreground">
                  {new Date(v.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
