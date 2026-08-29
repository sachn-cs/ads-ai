import { loadConfig } from '@/src/db/configs';
import { listMembers, listInvites } from '@/src/db/team';
import { listProductions } from '@/src/db/productions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const config = loadConfig();
  const productions = listProductions(100, 0);
  const members = listMembers();
  const invites = listInvites();
  const textEnabled = config.textProvider.enabled;
  const rendersEnabled = Object.entries(config.renderProviders).filter(([, p]) => p.enabled);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Settings</p>
        <h1 className="font-display text-3xl">Operator settings</h1>
        <p className="text-sm text-muted-foreground">
          Cinestudio-wide config and team management. Per-production settings live on each production page.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle>Text provider</CardTitle>
            <CardDescription>LLM backend for every agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Provider:</span>{' '}
              <Badge variant="outline">{config.textProvider.provider}</Badge>
            </p>
            <p>
              <span className="text-muted-foreground">Model:</span>{' '}
              <span className="font-mono">{config.textProvider.model}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Enabled:</span>{' '}
              <Badge variant={textEnabled ? 'default' : 'destructive'}>
                {textEnabled ? 'yes' : 'no'}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle>Render providers</CardTitle>
            <CardDescription>{rendersEnabled.length} enabled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(config.renderProviders).map(([k, p]) => (
              <p key={k} className="flex items-center justify-between">
                <span className="font-mono">{k}</span>
                <Badge variant={p.enabled ? 'default' : 'outline'}>
                  {p.enabled ? 'on' : 'off'}
                </Badge>
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle>Productions</CardTitle>
            <CardDescription>{productions.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage productions from the productions page. This page shows operator-wide counts.
            </p>
          </CardContent>
        </Card>

        <Card className="warm-shadow">
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>
              {members.length} member · {invites.length} invite{invites.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Mode:</span>{' '}
              <Badge variant="outline">single-operator</Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              Multi-account coming soon — data model ready.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
