import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AssetCollection } from '@/src/db/assets';

export function CollectionSidebar({
  collections,
  productionId,
}: {
  collections: AssetCollection[];
  productionId: string;
}) {
  return (
    <aside className="space-y-3">
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="text-base">Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {collections.length === 0 && (
            <p className="text-sm text-muted-foreground">No collections yet.</p>
          )}
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/productions/${productionId}/assets?collection=${c.id}`}
              className="block truncate rounded-md px-2 py-1 text-sm hover:bg-secondary"
            >
              {c.name}
            </Link>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
