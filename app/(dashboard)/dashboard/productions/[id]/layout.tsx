import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProduction } from '@/src/db/productions';
import { listThreads } from '@/src/db/copilot';
import { TopBar } from '@/components/production/top-bar';
import { TabsStrip } from '@/components/production/tabs-strip';
import { LeftRail } from '@/components/production/left-rail';
import { TooltipProvider } from '@/components/ui/tooltip';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'overview', label: 'Overview', href: '' },
  { key: 'story', label: 'Story', href: '/story' },
  { key: 'characters', label: 'Characters', href: '/characters' },
  { key: 'wardrobe', label: 'Wardrobe', href: '/wardrobe' },
  { key: 'locations', label: 'Locations', href: '/locations' },
  { key: 'scenes', label: 'Scenes', href: '/scenes' },
  { key: 'shots', label: 'Shots', href: '/shots' },
  { key: 'transitions', label: 'Transitions', href: '/transitions' },
  { key: 'continuity', label: 'Continuity', href: '/continuity' },
  { key: 'runs', label: 'Runs', href: '/runs' },
  { key: 'versions', label: 'Versions', href: '/versions' },
  { key: 'exports', label: 'Exports', href: '/exports' },
  { key: 'comments', label: 'Comments', href: '/comments' },
  { key: 'agents', label: 'Agents', href: '/agents' },
  { key: 'knowledge', label: 'Knowledge', href: '/knowledge' },
  { key: 'assets', label: 'Assets', href: '/assets' },
  { key: 'copilot', label: 'Copilot', href: '/copilot' },
  { key: 'settings', label: 'Settings', href: '/settings' },
];

export default async function ProductionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const threads = listThreads(id);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TopBar production={production} />
        <TabsStrip productionId={id} tabs={TABS} />
        <div className="flex flex-1">
          <LeftRail productionId={id} threads={threads} />
          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
        <Link href={`/dashboard/productions/${id}`} hidden />
      </div>
    </TooltipProvider>
  );
}

export { TABS };
