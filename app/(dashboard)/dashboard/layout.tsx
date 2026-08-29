import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden cinema-grain">
      <header className="shrink-0 border-b bg-background/80 backdrop-blur">
        <div className="flex h-10 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-4 w-4 text-cinematic-gold" />
            <Link href="/dashboard" className="font-mono text-sm font-semibold tracking-tight">
              cinestudio
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
            <Link href="/dashboard/productions" className="transition-colors hover:text-foreground">Productions</Link>
            <Link href="/dashboard/templates" className="transition-colors hover:text-foreground">Templates</Link>
            <Link href="/dashboard/agents" className="transition-colors hover:text-foreground">Agents</Link>
            <Link href="/dashboard/queue" className="transition-colors hover:text-foreground">Queue</Link>
            <Link href="/dashboard/analytics" className="transition-colors hover:text-foreground">Analytics</Link>
            <Link href="/dashboard/team" className="transition-colors hover:text-foreground">Team</Link>
            <Link href="/dashboard/settings" className="transition-colors hover:text-foreground">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}