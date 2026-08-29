import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function ShotProgressChart({ productionId }: { productionId: string | null }) {
  const pct = productionId ? 32 : 0;
  return (
    <Card className="warm-shadow h-full">
      <CardHeader className="space-y-0 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Activity className="h-3.5 w-3.5 text-gold" /> Shot planning
        </CardTitle>
        <CardDescription className="text-[10px]">
          {productionId ? 'Storyboard coverage' : 'No production'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2">
        <Progress value={pct} className="h-1.5 bg-ink-800" />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Storyboard</span>
          <span className="text-gold">{pct}%</span>
        </div>
      </CardContent>
    </Card>
  );
}