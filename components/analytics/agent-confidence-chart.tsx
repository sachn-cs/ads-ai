import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AgentConfidenceChart() {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>Agent confidence trends</CardTitle>
        <CardDescription>Per-agent self-reported confidence</CardDescription>
      </CardHeader>
      <CardContent className="h-32 place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground grid">
        Aggregated once runs accumulate.
      </CardContent>
    </Card>
  );
}
