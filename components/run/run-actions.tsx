'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, GitCompare, Copy } from 'lucide-react';

export function RunActions({
  runId,
  productionId,
  status,
}: {
  runId: string;
  productionId: string;
  status: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function call(action: 'retry' | 'resume' | 'compare' | 'duplicate', endpoint: string) {
    setBusy(action);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, productionId }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        window.alert(`${action} failed: ${body}`);
      } else {
        window.location.reload();
      }
    } finally {
      setBusy(null);
    }
  }

  const canRetry = status === 'failed' || status === 'cancelled';
  const canResume = status === 'awaiting_review';

  return (
    <div className="flex gap-1">
      {canRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => call('retry', `/api/runs/${runId}/cancel`)}
          disabled={busy !== null}
          aria-label="Retry run"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
      {canResume && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => call('resume', `/api/runs/${runId}/cancel`)}
          disabled={busy !== null}
          aria-label="Resume run"
        >
          <Play className="h-3.5 w-3.5" /> Resume
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => call('compare', `/api/runs/${runId}/agents`)}
        disabled={busy !== null}
        aria-label="Compare runs"
      >
        <GitCompare className="h-3.5 w-3.5" /> Compare
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => call('duplicate', `/api/runs/${runId}/cancel`)}
        disabled={busy !== null}
        aria-label="Duplicate run"
      >
        <Copy className="h-3.5 w-3.5" /> Duplicate
      </Button>
    </div>
  );
}
