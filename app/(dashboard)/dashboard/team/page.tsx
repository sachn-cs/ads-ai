import { ensureDefaultOperator, listInvites } from '@/src/db/team';
import { OperatorCard } from '@/components/team/operator-card';
import { InviteList } from '@/components/team/invite-list';
import { RoleDefinitions } from '@/components/team/role-definitions';
import { MultiAccountBadge } from '@/components/team/multi-account-badge';

export const dynamic = 'force-dynamic';

export default function TeamPage() {
  const operator = ensureDefaultOperator();
  const invites = listInvites();

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Team</p>
          <h1 className="font-display text-3xl">Team</h1>
          <p className="text-sm text-muted-foreground">
            Single-operator mode. The data model is ready for multi-user.
          </p>
        </div>
        <MultiAccountBadge />
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Operators</h2>
        <OperatorCard member={operator} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Role definitions</h2>
        <RoleDefinitions />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Invites</h2>
        <InviteList invites={invites} />
      </section>
    </div>
  );
}
