import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { EmptyState } from '@/components/production/empty-state';

export const dynamic = 'force-dynamic';

export default async function ExportsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Exports</p>
        <h1 className="font-display text-3xl">Render outputs & deliverables</h1>
      </header>
      <EmptyState title="No exports yet" description="Completed runs will surface rendered videos here." />
    </div>
  );
}
