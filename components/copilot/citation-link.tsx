import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { CopilotCitation } from '@/src/db/copilot';

export function CitationLink({ citation }: { citation: CopilotCitation }) {
  const href = citation.href ?? '#';
  return (
    <Link href={href} className="inline-flex">
      <Badge variant="outline" className="border-gold/40 text-gold">
        {citation.label}
      </Badge>
    </Link>
  );
}
