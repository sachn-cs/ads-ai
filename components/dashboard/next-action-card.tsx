import { Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NextActionCard({ productionId }: { productionId: string | null }) {
  return (
    <Card className="warm-shadow border-gold/30 ring-gold">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base text-gold">
          <Wand2 className="h-4 w-4" />
          Next best action
        </CardTitle>
        <CardDescription>Suggested by Cinestudio based on your production state.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {productionId ? (
          <>
            <p className="text-sm text-bone">
              Refine your logline and add a treatment so the swarm can shape Characters and Wardrobe
              with your intent.
            </p>
            <Button asChild className="w-full">
              <a href={`/dashboard/productions/${productionId}/story`}>Open Story</a>
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Create a production to see suggestions.</p>
        )}
      </CardContent>
    </Card>
  );
}
