'use client';

import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VoiceButton({ onTranscript }: { onTranscript?: (text: string) => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onTranscript?.('(voice input not yet enabled)')}
      aria-label="Voice input"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
