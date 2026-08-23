import Link from 'next/link';
import { Film, Clapperboard, Sparkles, Workflow, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OnboardingEntry() {
  return (
    <div className="min-h-screen cinema-grain">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <header className="mb-12 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full border border-dashed border-cinematic-gold/50 p-3">
            <Clapperboard className="h-8 w-8 text-cinematic-gold" />
          </div>
          <h1 className="font-mono text-5xl font-bold tracking-tight">cinestudio</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A multi-agent AI film rendering platform. 30-second spots to 20-minute shorts,
            orchestrated by a 17-agent Strands Graph with a parallel render Workflow.
          </p>
        </header>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Sparkles className="h-5 w-5 text-cinematic-gold" />
              <CardTitle>Multi-agent by design</CardTitle>
              <CardDescription>
                A Showrunner crafts the brief; Script, Character, World, Storyboard, Render
                Planner, Continuity, Critique, Iteration, Scoring, Editor, Colorist,
                Composer, Sound, Voice, Distribution, and Rights Clearance each have a job.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Workflow className="h-5 w-5 text-cinematic-gold" />
              <CardTitle>Render fans out in parallel</CardTitle>
              <CardDescription>
                The ShotPlanner batches shots by style. RenderDispatcher fires them
                concurrently across Veo 3.1, Sora, or Runway at per-provider
                concurrency limits.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <ShieldCheck className="h-5 w-5 text-cinematic-gold" />
              <CardTitle>Surgical iteration</CardTitle>
              <CardDescription>
                The Critique scores each shot across 10 dimensions. The IterationController
                produces per-shot directives; only failing shots are re-rendered.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Film className="h-5 w-5 text-cinematic-gold" />
              <CardTitle>Ship-ready outputs</CardTitle>
              <CardDescription>
                Editor + Colorist + Composer + Sound Designer produce assembly LUTs,
                score cue maps, and exports for YouTube, Vimeo, festival 4K, and more.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <Button asChild size="lg">
            <Link href="/onboarding/setup">Start setup</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
