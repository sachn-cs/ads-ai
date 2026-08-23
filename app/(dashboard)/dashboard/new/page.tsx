'use client';

import { useEffect, useState, useTransition } from 'react';
import type { IdeaVariant } from '@/src/models';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface IdeaExpansionResult {
  runId: string;
  result: { variants: IdeaVariant[]; modelUsed: string; generatedAt: string };
}

type Phase = 'compose' | 'pick' | 'starting';

export default function NewFilmPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('compose');
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('narrative_short');
  const [count, setCount] = useState(3);
  const [expanding, setExpanding] = useState(false);
  const [expansion, setExpansion] = useState<IdeaExpansionResult | null>(null);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // variants are already populated from /api/ideas/expand; nothing to refresh.
    void phase;
  }, [phase]);

  async function handleExpand() {
    if (prompt.trim().length < 5) {
      toast.error('Give the IdeaExpander at least a sentence.');
      return;
    }
    setExpanding(true);
    try {
      const res = await fetch('/api/ideas/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `[${genre}] ${prompt}`, count }),
      });
      if (!res.ok) {
        const err = await res.text();
        toast.error(`Failed to expand idea: ${err}`);
        return;
      }
      const data = (await res.json()) as IdeaExpansionResult;
      setExpansion(data);
      setPhase('pick');
      toast.success(`Generated ${data.result.variants.length} idea variants.`);
    } catch (err) {
      toast.error(`Error: ${String(err)}`);
    } finally {
      setExpanding(false);
    }
  }

  async function handleSelect(variantIndex: number) {
    if (!expansion) return;
    setSelecting(variantIndex);
    try {
      const res = await fetch(`/api/ideas/select/${expansion.runId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantIndex }),
      });
      if (!res.ok) {
        toast.error(`Failed to select variant: ${await res.text()}`);
        return;
      }
      const body = await res.json();
      const brief = body.selectedVariant?.brief ?? body.selectedVariant;
      toast.success('Starting pipeline with selected brief…');
      startTransition(() => {
        void fetch('/api/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId: expansion.runId, brief }),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`run start failed (${r.status})`))))
          .then((data: { runId?: string }) => {
            const id = data.runId ?? expansion.runId;
            router.push(`/dashboard/runs/${id}`);
          })
          .catch(() => {
            router.push(`/dashboard/runs/${expansion.runId}`);
          });
      });
    } catch (err) {
      toast.error(`Error: ${String(err)}`);
    } finally {
      setSelecting(null);
    }
  }

  if (phase === 'pick' && expansion) {
    return (
      <IdeaPicker
        expansion={expansion}
        prompt={prompt}
        selecting={selecting}
        onSelect={handleSelect}
        onBack={() => {
          setPhase('compose');
          setExpansion(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-mono text-3xl font-bold tracking-tight">New film</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Phase 1 / Write the seed idea. cinestudio&apos;s IdeaExpander will
        generate 3 directions; you&apos;ll pick one before the pipeline starts.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <Sparkles className="h-5 w-5 text-cinematic-gold" />
          <CardTitle>Idea</CardTitle>
          <CardDescription>A feeling, a reference, a logline — anything.</CardDescription>
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
                <SelectItem value="micro_drama">Micro drama</SelectItem>
                <SelectItem value="animation">Animation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Your idea</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A teacher in a small coastal town receives a letter from a student she thought she'd lost."
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="count">How many variants?</Label>
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger id="count"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleExpand} disabled={expanding} size="lg">
            {expanding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Expanding…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate variants
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface IdeaPickerProps {
  expansion: IdeaExpansionResult;
  prompt: string;
  selecting: number | null;
  onSelect: (idx: number) => void;
  onBack: () => void;
}

function IdeaPicker({ expansion, prompt, selecting, onSelect, onBack }: IdeaPickerProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight">Pick a direction</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {expansion.result.variants.length} variants from &quot;{prompt.slice(0, 60)}…&quot;
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>← Back</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {expansion.result.variants.map((v) => (
          <Card key={v.index} className={cn('flex flex-col')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Variant {v.index + 1}</Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(v.confidence * 100)}% confidence
                </span>
              </div>
              <CardTitle className="mt-2 line-clamp-2 text-lg">
                {v.brief.logline}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm">
              <p className="text-xs text-muted-foreground line-clamp-4">
                {v.rationale}
              </p>
              <p className="line-clamp-4">{v.brief.synopsis}</p>
              <div className="flex flex-wrap gap-1">
                {v.brief.tone.map((t) => (
                  <Badge key={t} variant="outline">{t}</Badge>
                ))}
                <Badge variant="outline">{v.brief.genre}</Badge>
                <Badge variant="outline">{v.brief.targetRuntimeSeconds}s</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => onSelect(v.index)}
                disabled={selecting !== null}
                className="w-full"
              >
                {selecting === v.index ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                  </>
                ) : (
                  'Use this direction'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
