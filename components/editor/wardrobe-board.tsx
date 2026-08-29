import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Character } from '@/src/db/characters';

export function WardrobeBoard({ character }: { character: Character }) {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>{character.name}</CardTitle>
        <CardDescription>Outfit variants per scene</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Default</Badge>
          <Badge variant="outline">Casual</Badge>
          <Badge variant="outline">Formal</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
