import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamRole } from '@/src/db/team';

const ROLES: { role: TeamRole; description: string }[] = [
  { role: 'owner', description: 'Full control over productions, settings, and team.' },
  { role: 'editor', description: 'Create and edit characters, scenes, shots, wardrobe, locations.' },
  { role: 'commenter', description: 'Read everything; comment and react without editing.' },
];

export function RoleDefinitions() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {ROLES.map((r) => (
        <Card key={r.role} className="warm-shadow">
          <CardHeader>
            <CardTitle className="text-base">{r.role}</CardTitle>
            <CardDescription>{r.description}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
