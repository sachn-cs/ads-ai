'use client';

import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AiTagger({ onTags }: { onTags: (tags: string[]) => void }) {
  return (
    <Button variant="outline" size="sm" onClick={() => onTags(['character', 'moodboard'])}>
      <Wand2 className="h-4 w-4" /> AI-tag
    </Button>
  );
}
