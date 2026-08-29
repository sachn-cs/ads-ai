import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const dynamic = 'force-dynamic';

export default async function SettingsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Settings</p>
        <h1 className="font-display text-3xl">Production settings</h1>
      </header>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Production name (used in agent prompts).</CardDescription>
        </CardHeader>
        <CardContent>
          <Input defaultValue={production.title} />
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Logline</CardTitle>
          <CardDescription>One-sentence story hook.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea defaultValue={production.logline} className="min-h-24" />
        </CardContent>
      </Card>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['draft', 'active', 'archived'] as const).map((s) => (
              <Button key={s} variant={production.status === s ? 'default' : 'outline'} size="sm">
                {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
