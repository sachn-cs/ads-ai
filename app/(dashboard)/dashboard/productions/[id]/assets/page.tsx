import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listAssets, listCollections } from '@/src/db/assets';
import { EmptyState } from '@/components/production/empty-state';
import { AssetGrid } from '@/components/assets/asset-grid';
import { CollectionSidebar } from '@/components/assets/collection-sidebar';

export const dynamic = 'force-dynamic';

export default async function AssetsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const assets = listAssets(id);
  const collections = listCollections(id);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Assets</p>
        <h1 className="font-display text-3xl">Library</h1>
        <p className="text-sm text-muted-foreground">Characters, wardrobe, locations, props, moodboards.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        <CollectionSidebar collections={collections} productionId={id} />
        {assets.length === 0 ? (
          <EmptyState title="No assets yet" description="Upload or generate assets." />
        ) : (
          <AssetGrid assets={assets} />
        )}
      </div>
    </div>
  );
}
