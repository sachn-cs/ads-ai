'use client';

import { Textarea } from '@/components/ui/textarea';

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-48 font-mono text-sm"
    />
  );
}
