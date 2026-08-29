import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ContinuityHeatmap({ productionId }: { productionId: string }) {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>Wardrobe continuity heatmap</CardTitle>
        <CardDescription>Character × scene matrix</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid h-32 place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          Heatmap renders once wardrobe + scenes are populated.
        </div>
      </CardContent>
    </Card>
  );
}
