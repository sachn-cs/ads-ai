import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listThreads } from '@/src/db/copilot';
import { CopilotThread } from '@/components/copilot/message-bubble';

export const dynamic = 'force-dynamic';

export default async function CopilotTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const threads = listThreads(id);
  return <CopilotThread productionId={id} initialThreads={threads} />;
}
