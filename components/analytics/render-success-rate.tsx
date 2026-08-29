import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RenderSuccessRate() {
  return (
    <Card className="warm-shadow">
      <CardHeader>
        <CardTitle>Render success rate</CardTitle>
        <CardDescription>Across providers</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="outline" className="border-gold/40 text-gold">— %</Badge>
      </CardContent>
    </Card>
  );
}
