import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Invite } from '@/src/db/team';

export function InviteList({ invites }: { invites: Invite[] }) {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>Invites</CardTitle>
        <CardDescription>Token-based invites. Single-operator for now.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active invites.</p>
        ) : (
          invites.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-mono text-xs text-bone">{i.token.slice(0, 12)}…</p>
                <p className="text-xs text-muted-foreground">
                  {i.role} · {new Date(i.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={i.acceptedAt ? 'default' : 'outline'}>
                  {i.acceptedAt ? 'accepted' : 'pending'}
                </Badge>
                <Button variant="ghost" size="sm">Revoke</Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
