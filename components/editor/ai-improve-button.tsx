'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AiImproveButton({
  productionId,
  target,
}: {
  productionId: string;
  target: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        setTimeout(() => setBusy(false), 800);
      }}
    >
      <Wand2 className="h-4 w-4" /> {busy ? 'Improving…' : `Improve ${target}`}
    </Button>
  );
}
