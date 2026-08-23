'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MultimodalAsset {
  id: number;
  kind: 'character_portrait' | 'storyboard_frame' | 'voice_line' | 'foley' | 'score_stem' | 'cutdown' | 'thumbnail';
  artifact_id: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

interface MultimodalAssetsResponse {
  runId: string;
  assets: MultimodalAsset[];
}

const KIND_LABEL: Record<MultimodalAsset['kind'], string> = {
  character_portrait: 'Character portraits',
  storyboard_frame: 'Storyboard frames',
  voice_line: 'Voice lines',
  foley: 'Sound design',
  score_stem: 'Score stems',
  cutdown: 'Marketing cutdowns',
  thumbnail: 'Marketing thumbnails',
};

export interface MultimodalGalleryProps {
  runId: string;
}

export function MultimodalGallery({ runId }: MultimodalGalleryProps) {
  const [data, setData] = useState<MultimodalAssetsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/runs/${runId}/multimodal`);
        if (!cancelled && res.ok) {
          const json = (await res.json()) as MultimodalAssetsResponse;
          setData(json);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multimodal artifacts</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!data || data.assets.length === 0) return null;

  const grouped = data.assets.reduce<Record<string, MultimodalAsset[]>>((acc, a) => {
    (acc[a.kind] ||= []).push(a);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multimodal artifacts</CardTitle>
        <CardDescription>{data.assets.length} assets from MiniMax image / speech / music generation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([kind, items]) => (
          <section key={kind}>
            <h3 className="mb-2 text-sm font-semibold">{KIND_LABEL[kind as MultimodalAsset['kind']] ?? kind}</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {items.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset }: { asset: MultimodalAsset }) {
  const isAudio = asset.content_type?.startsWith('audio') ?? false;
  const isImage = asset.content_type?.startsWith('image') ?? false;
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="flex aspect-video items-center justify-center bg-muted text-xs text-muted-foreground">
        {isAudio ? (
          <span>♪ {asset.content_type ?? 'audio'}</span>
        ) : isImage ? (
          <span>🖼 {asset.content_type ?? 'image'}</span>
        ) : (
          <span>{asset.content_type ?? 'asset'}</span>
        )}
      </div>
      <div className="p-2">
        <p className="truncate font-mono text-[10px] text-muted-foreground">{asset.artifact_id}</p>
      </div>
    </div>
  );
}
