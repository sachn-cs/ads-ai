import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RevisionCountChart() {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>Revisions per production</CardTitle>
        <CardDescription>Edit volume across productions</CardDescription>
      </CardHeader>
      <CardContent className="h-32 place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground grid">
        Aggregated once versions accumulate.
      </CardContent>
    </Card>
  );
}
