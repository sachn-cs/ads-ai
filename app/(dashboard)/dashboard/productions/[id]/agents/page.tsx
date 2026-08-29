import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const AGENTS = [
  { id: 'showrunner', name: 'Showrunner', description: 'Synthesizes the CinestudioBrief.' },
  { id: 'style_guide', name: 'Style Guide', description: 'Visual bible (palette, lensing, grain).' },
  { id: 'story_analyst', name: 'Story Analyst', description: 'Story structure + thematic depth.' },
  { id: 'character_designer', name: 'Character Designer', description: 'Cast with intent.' },
  { id: 'costume_designer', name: 'Costume Designer', description: 'Wardrobe logic + continuity.' },
  { id: 'environment_designer', name: 'Environment Designer', description: 'Locations + atmosphere.' },
  { id: 'script_writer', name: 'Script Writer', description: 'Beats + dialogue.' },
  { id: 'scene_composer', name: 'Scene Composer', description: 'Breaks script into scenes.' },
  { id: 'shot_planner', name: 'Shot Planner', description: 'Shot list with framing + lens.' },
  { id: 'continuity_supervisor', name: 'Continuity Supervisor', description: 'Wardrobe, object, spatial, emotional, temporal.' },
  { id: 'transition_designer', name: 'Transition Designer', description: 'Per-cut intent + continuity.' },
  { id: 'pacing_analyst', name: 'Pacing Analyst', description: 'Beat density + rhythm.' },
  { id: 'visual_quality_reviewer', name: 'Visual Quality Reviewer', description: 'Style guide adherence.' },
  { id: 'render_dispatcher', name: 'Render Dispatcher', description: 'MiniMax-H3 parallel renders.' },
  { id: 'production_coordinator', name: 'Production Coordinator', description: 'Tracks unresolved dependencies.' },
  { id: 'scoring', name: 'Scoring', description: 'Composite quality score.' },
  { id: 'critique', name: 'Critique', description: 'Per-shot GO/NO-GO.' },
  { id: 'editor', name: 'Editor', description: 'Assembly plan.' },
  { id: 'colorist', name: 'Colorist', description: 'Color grade direction.' },
  { id: 'composer', name: 'Composer', description: 'Score plan.' },
  { id: 'sound_designer', name: 'Sound Designer', description: 'Foley + atmosphere.' },
  { id: 'voice_casting', name: 'Voice Casting', description: 'Voice cast + lines.' },
  { id: 'copilot', name: 'Copilot', description: 'Production-scoped creative partner.' },
];

export default async function AgentsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Agents</p>
        <h1 className="font-display text-3xl">Swarm + Workflow</h1>
        <p className="text-sm text-muted-foreground">22 specialists coordinated by a Strands Graph.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((a) => (
          <Card key={a.id} className="warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                {a.name}
                <Badge variant="outline" className="font-mono text-xs">
                  {a.id}
                </Badge>
              </CardTitle>
              <CardDescription>{a.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">Production: {id.slice(0, 8)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
