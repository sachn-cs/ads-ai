import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listVersions } from '@/src/db/versions';
import { EmptyState } from '@/components/production/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function VersionsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const versions = listVersions(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Versions</p>
        <h1 className="font-display text-3xl">Revision history</h1>
        <p className="text-sm text-muted-foreground">{versions.length} snapshot{versions.length === 1 ? '' : 's'}.</p>
      </header>

      {versions.length === 0 ? (
        <EmptyState title="No versions yet" description="Edit a character, scene, or shot to create a version snapshot." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.entityType}</TableCell>
                <TableCell className="font-mono">v{v.versionNumber}</TableCell>
                <TableCell>{v.createdBy ?? '—'}</TableCell>
                <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
