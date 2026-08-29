import { AssetCard } from './asset-card';
import type { Asset } from '@/src/db/assets';

export function AssetGrid({ assets }: { assets: Asset[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {assets.map((a) => (
        <AssetCard key={a.id} asset={a} />
      ))}
    </div>
  );
}
