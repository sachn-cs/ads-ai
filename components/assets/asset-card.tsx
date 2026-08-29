import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Asset } from '@/src/db/assets';

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <Card className="warm-shadow transition-colors hover:border-gold/40">
      <CardContent className="space-y-2 p-4">
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-ink-900/40 text-xs text-muted-foreground">
          {asset.kind}
        </div>
        <p className="truncate text-sm font-medium">{asset.title}</p>
        <div className="flex flex-wrap gap-1">
          {asset.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="outline" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
