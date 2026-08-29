import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function ShotProgressChart({ productionId }: { productionId: string | null }) {
  const pct = productionId ? 32 : 0;
  return (
    <Card className="warm-shadow">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-gold" />
          Shot planning progress
        </CardTitle>
        <CardDescription>
          {productionId ? 'Coverage of storyboard + shot list for the active production.' : 'No production selected.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={pct} className="h-2 bg-ink-800" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Storyboard</span>
          <span className="text-gold">{pct}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
