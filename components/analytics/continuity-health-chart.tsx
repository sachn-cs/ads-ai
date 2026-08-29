import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ContinuityHealthChart() {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>Continuity health</CardTitle>
        <CardDescription>Open gaps over time</CardDescription>
      </CardHeader>
      <CardContent className="h-32 place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground grid">
        Time-series renders once runs accumulate.
      </CardContent>
    </Card>
  );
}
