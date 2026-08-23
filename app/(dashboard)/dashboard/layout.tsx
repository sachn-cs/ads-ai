import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col cinema-grain">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Clapperboard className="h-5 w-5 text-cinematic-gold" />
            <Link href="/dashboard" className="font-mono text-lg font-semibold tracking-tight">
              cinestudio
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">Runs</Link>
            <Link href="/dashboard/new" className="transition-colors hover:text-foreground">New film</Link>
            <Link href="/onboarding/setup" className="transition-colors hover:text-foreground">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
