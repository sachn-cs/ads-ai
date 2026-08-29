import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '@/src/db/team';

export function OperatorCard({ member }: { member: TeamMember }) {
  return (
    <Card className="warm-shadow">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Avatar>
          <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base">{member.name}</CardTitle>
          <CardDescription>{member.email ?? 'No email'}</CardDescription>
        </div>
        <Badge variant="outline" className="border-gold/40 text-gold">
          {member.role}
        </Badge>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
