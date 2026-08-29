import Link from 'next/link';
import { createProduction } from '@/src/db/productions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function createProductionAction(formData: FormData) {
  'use server';
  const title = String(formData.get('title') ?? '').trim();
  const logline = String(formData.get('logline') ?? '').trim();
  const template = String(formData.get('template') ?? '').trim();
  if (!title) return;
  const production = createProduction({ title, logline });
  void template;
  const { redirect } = await import('next/navigation');
  redirect(`/dashboard/productions/${production.id}`);
}

export default async function NewProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">New production</p>
        <h1 className="font-display text-3xl">Start a film</h1>
        <p className="text-sm text-muted-foreground">
          Give Cinestudio a title and a one-line pitch. The swarm will help shape it.
        </p>
      </header>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle>Title & logline</CardTitle>
          <CardDescription>
            {template
              ? `Seeded with template: ${template}`
              : 'Or pick a template from the Templates page.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProductionAction} className="space-y-4">
            <input type="hidden" name="template" value={template ?? ''} />
            <Input name="title" placeholder="Working title" required />
            <Textarea
              name="logline"
              placeholder="One sentence that captures the story."
              className="min-h-24"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/templates">
                  <Sparkles className="h-4 w-4" /> Pick a template
                </Link>
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
