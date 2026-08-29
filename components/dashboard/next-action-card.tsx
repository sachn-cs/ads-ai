import { Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NextActionCard({ productionId }: { productionId: string | null }) {
  return (
    <Card className="warm-shadow h-full border-gold/30 ring-gold">
      <CardHeader className="space-y-0 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm text-gold">
          <Wand2 className="h-3.5 w-3.5" /> Next best action
        </CardTitle>
        <CardDescription className="text-[10px]">AI-suggested.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2">
        {productionId ? (
          <>
            <p className="text-xs text-bone">
              Refine logline + treatment so the swarm can shape Characters and Wardrobe.
            </p>
            <Button asChild size="sm" className="w-full">
              <a href={`/dashboard/productions/${productionId}/story`}>Open Story</a>
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Create a production.</p>
        )}
      </CardContent>
    </Card>
  );
}