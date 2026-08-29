'use client';

import { MarkdownEditor } from '@/components/editor/markdown-editor';

export function BibleEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <MarkdownEditor value={value} onChange={onChange} placeholder="Write your bible entry…" />;
}
