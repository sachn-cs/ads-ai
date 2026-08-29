'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function TagPicker({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="flex flex-wrap items-center gap-1">
      {value.map((t) => (
        <Badge
          key={t}
          variant="outline"
          onClick={() => onChange(value.filter((x) => x !== t))}
          className="cursor-pointer"
        >
          {t} ×
        </Badge>
      ))}
      <Input
        className="h-7 w-32"
        placeholder="Add tag"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim()) {
            onChange([...value, draft.trim()]);
            setDraft('');
          }
        }}
      />
    </div>
  );
}
