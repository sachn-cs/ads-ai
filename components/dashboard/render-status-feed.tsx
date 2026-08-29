import { Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RenderStatusFeed({ runs }: { runs: { id: string; status: string; title: string | null; prompt: string }[] }) {
  const recent = runs.slice(0, 4);
  return (
    <Card className="warm-shadow h-full">
      <CardHeader className="space-y-0 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Radio className="h-3.5 w-3.5 text-gold" /> Render status
        </CardTitle>
        <CardDescription className="text-[10px]">{recent.length} recent</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs">
                <span className="truncate text-bone">{r.title ?? r.prompt.slice(0, 40)}</span>
                <Badge variant={r.status === 'completed' ? 'default' : 'outline'} className="px-1.5 py-0 text-[10px]">
                  {r.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}