'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewRunPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('narrative_short');
  const [submitting, setSubmitting] = useState(false);

  async function handleStart() {
    if (prompt.trim().length < 5) {
      toast.error('Give the Showrunner at least a sentence.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `[${genre}] ${prompt}` }),
      });
      if (!res.ok) {
        toast.error(`Failed to start run: ${await res.text()}`);
        return;
      }
      const body = (await res.json()) as { runId: string };
      router.push(`/dashboard/runs/${body.runId}`);
    } catch (err) {
      toast.error(`Error: ${String(err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-mono text-3xl font-bold tracking-tight">New film</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell the Showrunner what you want — logline, reference, or full treatment. The
        brief will be locked before script, character, and world design start.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <Sparkles className="h-5 w-5 text-cinematic-gold" />
          <CardTitle>Brief</CardTitle>
          <CardDescription>One shot. Anything from a single sentence to a treatment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="genre">Genre marker</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger id="genre"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="narrative_short">Narrative short</SelectItem>
                <SelectItem value="music_video">Music video</SelectItem>
                <SelectItem value="trailer">Trailer</SelectItem>
                <SelectItem value="documentary">Documentary</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
                <SelectItem value="animation">Animation</SelectItem>
                <SelectItem value="micro_drama">Micro drama</SelectItem>
                <SelectItem value="product_film">Product film</SelectItem>
                <SelectItem value="brand_film">Brand film</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Your idea</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A teacher in a small coastal town receives a letter from a student she thought she'd lost — 90 seconds, single-take."
              rows={8}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStart} disabled={submitting} size="lg">
            <Sparkles className="h-4 w-4" /> {submitting ? 'Starting…' : 'Start render'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
